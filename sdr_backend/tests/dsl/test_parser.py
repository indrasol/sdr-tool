import pytest
import json
import subprocess
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, Any

from core.dsl.parser_d2_lang import D2LangParser
from core.dsl.validators import DiagramValidator
from core.dsl.dsl_types import DSLDiagram, DSLNode, DSLEdge


class TestD2LangParser:
    """Test D2 language parser functionality."""
    
    def setup_method(self):
        self.parser = D2LangParser()
    
    def test_parse_empty_string_raises_error(self):
        """Test that empty D2 source raises ValueError."""
        with pytest.raises(ValueError, match="D2 source is empty"):
            self.parser.parse("")
    
    def test_parse_whitespace_only_raises_error(self):
        """Test that whitespace-only D2 source raises ValueError."""
        with pytest.raises(ValueError, match="D2 source is empty"):
            self.parser.parse("   \n  \t  ")
    
    @patch('subprocess.run')
    def test_parse_simple_diagram(self, mock_subprocess):
        """Test parsing a simple D2 diagram."""
        # Mock subprocess response
        mock_result = Mock()
        mock_result.stdout = json.dumps({
            "nodes": [
                {"id": "client", "label": "Client App", "x": 100, "y": 200, "width": 120, "height": 80},
                {"id": "server", "label": "Web Server", "x": 300, "y": 200, "width": 120, "height": 80}
            ],
            "edges": [
                {"Source": "client", "Target": "server", "Label": "HTTPS"}
            ]
        }).encode()
        mock_subprocess.return_value = mock_result
        
        d2_text = "client -> server: HTTPS"
        result = self.parser.parse(d2_text)
        
        # Verify subprocess was called correctly
        mock_subprocess.assert_called_once_with(
            ["d2json", "--layout", "elk"],
            input=d2_text.encode(),
            check=True,
            capture_output=True,
            timeout=30
        )
        
        # Verify parsed diagram structure
        assert isinstance(result, DSLDiagram)
        assert len(result.nodes) == 2
        assert len(result.edges) == 1
        
        # Check node structure
        client_node = result.nodes[0]
        assert client_node.id == "client"
        assert client_node.label == "Client App"
        assert client_node.type == "generic"
        assert client_node.x == 100.0
        assert client_node.y == 200.0
        assert client_node.width == 120.0
        assert client_node.height == 80.0
        
        # Check edge structure
        edge = result.edges[0]
        assert edge.id == "client->server"
        assert edge.source == "client"
        assert edge.target == "server"
        assert edge.label == "HTTPS"
    
    @patch('subprocess.run')
    def test_parse_nodes_without_edges(self, mock_subprocess):
        """Test parsing diagram with nodes but no edges."""
        mock_result = Mock()
        mock_result.stdout = json.dumps({
            "nodes": [
                {"id": "standalone", "label": "Standalone Node", "x": 0, "y": 0, "width": 100, "height": 60}
            ],
            "edges": []
        }).encode()
        mock_subprocess.return_value = mock_result
        
        result = self.parser.parse("standalone")
        
        assert len(result.nodes) == 1
        assert len(result.edges) == 0
        assert result.nodes[0].id == "standalone"
    
    @patch('subprocess.run')
    def test_parse_edges_without_label(self, mock_subprocess):
        """Test parsing edges without labels."""
        mock_result = Mock()
        mock_result.stdout = json.dumps({
            "nodes": [
                {"id": "a", "label": "A", "x": 0, "y": 0, "width": 60, "height": 36},
                {"id": "b", "label": "B", "x": 100, "y": 0, "width": 60, "height": 36}
            ],
            "edges": [
                {"Source": "a", "Target": "b"}  # No Label field
            ]
        }).encode()
        mock_subprocess.return_value = mock_result
        
        result = self.parser.parse("a -> b")
        
        assert len(result.edges) == 1
        assert result.edges[0].label is None
    
    @patch('subprocess.run')
    def test_parse_subprocess_error(self, mock_subprocess):
        """Test handling subprocess errors."""
        mock_subprocess.side_effect = subprocess.CalledProcessError(1, "d2json")
        
        with pytest.raises(ValueError, match="D2 compilation failed"):
            self.parser.parse("invalid d2 syntax")
    
    @patch('subprocess.run')
    def test_parse_invalid_json_response(self, mock_subprocess):
        """Test handling invalid JSON from subprocess."""
        mock_result = Mock()
        mock_result.stdout = b"invalid json"
        mock_subprocess.return_value = mock_result
        
        with pytest.raises(ValueError, match="Invalid JSON from d2json"):
            self.parser.parse("valid -> d2")
    
    @patch('subprocess.run')
    def test_parse_missing_node_id(self, mock_subprocess):
        """Test handling missing node ID."""
        mock_result = Mock()
        mock_result.stdout = json.dumps({
            "nodes": [
                {"label": "Node without ID", "x": 0, "y": 0, "width": 100, "height": 60}
            ],
            "edges": []
        }).encode()
        mock_subprocess.return_value = mock_result
        
        with pytest.raises(ValueError, match="Node missing required 'id' field"):
            self.parser.parse("node_without_id")
    
    @patch('subprocess.run')
    def test_parse_missing_edge_source(self, mock_subprocess):
        """Test handling missing edge source."""
        mock_result = Mock()
        mock_result.stdout = json.dumps({
            "nodes": [
                {"id": "a", "label": "A", "x": 0, "y": 0, "width": 60, "height": 36},
                {"id": "b", "label": "B", "x": 100, "y": 0, "width": 60, "height": 36}
            ],
            "edges": [
                {"Target": "b", "Label": "Edge without source"}
            ]
        }).encode()
        mock_subprocess.return_value = mock_result
        
        with pytest.raises(ValueError, match="Edge missing required 'Source' field"):
            self.parser.parse("a -> b")
    
    @patch('subprocess.run')
    def test_parse_timeout_error(self, mock_subprocess):
        """Test handling subprocess timeout."""
        mock_subprocess.side_effect = subprocess.TimeoutExpired("d2json", 30)
        
        with pytest.raises(ValueError, match="D2 compilation timeout"):
            self.parser.parse("complex diagram")


class TestDiagramValidator:
    """Test diagram validation functionality."""
    
    def setup_method(self):
        self.validator = DiagramValidator()
    
    def test_validate_empty_diagram(self):
        """Test validation of empty diagram."""
        diagram = DSLDiagram()
        is_valid, errors = self.validator.validate(diagram)
        
        assert is_valid is True
        assert errors == []
    
    def test_validate_valid_diagram(self):
        """Test validation of valid diagram."""
        diagram = DSLDiagram(
            nodes=[
                DSLNode(id="client", label="Client App", type="client"),
                DSLNode(id="server", label="Web Server", type="server")
            ],
            edges=[
                DSLEdge(id="client->server", source="client", target="server", label="HTTPS")
            ]
        )
        
        is_valid, errors = self.validator.validate(diagram)
        
        assert is_valid is True
        assert errors == []
    
    def test_validate_invalid_label_characters(self):
        """Test validation fails for invalid label characters."""
        diagram = DSLDiagram(
            nodes=[
                DSLNode(id="node1", label="Valid Label", type="generic"),
                DSLNode(id="node2", label="Invalid@#$%^&*()Label", type="generic"),
                DSLNode(id="node3", label="Emoji 😀 Label", type="generic")
            ]
        )
        
        is_valid, errors = self.validator.validate(diagram)
        
        assert is_valid is False
        assert len(errors) == 2
        assert "node2" in errors[0]
        assert "illegal label" in errors[0]
        assert "node3" in errors[1]
        assert "illegal label" in errors[1]
    
    def test_validate_label_too_long(self):
        """Test validation fails for labels exceeding 80 characters."""
        long_label = "a" * 81  # 81 characters
        # Pydantic model validation should catch this before our custom validator
        with pytest.raises(ValueError):
            DSLNode(id="node1", label=long_label, type="generic")
    
    def test_validate_invalid_iconify_id(self):
        """Test validation fails for invalid iconifyId."""
        diagram = DSLDiagram(
            nodes=[
                DSLNode(
                    id="node1", 
                    label="Valid Label", 
                    type="generic",
                    iconifyId="invalid@icon#id"
                )
            ]
        )
        
        is_valid, errors = self.validator.validate(diagram)
        
        assert is_valid is False
        assert len(errors) == 1
        assert "node1" in errors[0]
        assert "illegal iconifyId" in errors[0]
    
    def test_validate_valid_iconify_id(self):
        """Test validation passes for valid iconifyId."""
        diagram = DSLDiagram(
            nodes=[
                DSLNode(
                    id="node1", 
                    label="Valid Label", 
                    type="generic",
                    iconifyId="mdi:database"
                )
            ]
        )
        
        is_valid, errors = self.validator.validate(diagram)
        
        assert is_valid is True
        assert errors == []
    
    def test_validate_iconify_id_in_properties(self):
        """Test validation of iconifyId in properties (backward compatibility)."""
        diagram = DSLDiagram(
            nodes=[
                DSLNode(
                    id="node1", 
                    label="Valid Label", 
                    type="generic",
                    properties={"iconifyId": "invalid@icon"}
                )
            ]
        )
        
        is_valid, errors = self.validator.validate(diagram)
        
        assert is_valid is False
        assert len(errors) == 1
        assert "iconifyId in properties" in errors[0]
    
    def test_validate_data_url_in_label(self):
        """Test validation fails for data URLs in labels."""
        diagram = DSLDiagram(
            nodes=[
                DSLNode(id="node1", label="data:image/png;base64,abc123", type="generic")
            ]
        )
        
        is_valid, errors = self.validator.validate(diagram)
        
        assert is_valid is False
        assert len(errors) == 1  # Only data URL validation fails (more specific)
        assert "node1" in errors[0]
        assert "label embeds data URL" in errors[0]
    
    def test_validate_multiple_errors(self):
        """Test validation accumulates multiple errors."""
        diagram = DSLDiagram(
            nodes=[
                DSLNode(id="node1", label="Invalid@Label", type="generic"),
                DSLNode(id="node2", label="data:image/png;base64,abc", type="generic"),
                DSLNode(
                    id="node3", 
                    label="Valid Label", 
                    type="generic",
                    properties={"iconifyId": "invalid@icon"}
                )
            ]
        )
        
        is_valid, errors = self.validator.validate(diagram)
        
        assert is_valid is False
        assert len(errors) == 3  # node1: 1 error, node2: 1 error, node3: 1 error
        assert any("node1" in err for err in errors)
        assert any("node2" in err for err in errors)
        assert any("node3" in err for err in errors)


class TestComplexDiagram:
    """Test complex 50-node diagram to catch regressions."""
    
    def setup_method(self):
        self.parser = D2LangParser()
        self.validator = DiagramValidator()
    
    def create_50_node_d2_sample(self) -> str:
        """Create a sample D2 diagram with 50 nodes and various connections."""
        lines = []
        
        # Web tier (10 nodes)
        lines.extend([
            "web.load_balancer: Load Balancer",
            "web.web_server_1: Web Server 1",
            "web.web_server_2: Web Server 2", 
            "web.web_server_3: Web Server 3",
            "web.cdn: CDN",
            "web.firewall: Web Firewall",
            "web.api_gateway: API Gateway",
            "web.auth_service: Auth Service",
            "web.session_store: Session Store",
            "web.static_assets: Static Assets"
        ])
        
        # Application tier (15 nodes)
        lines.extend([
            "app.user_service: User Service",
            "app.order_service: Order Service",
            "app.payment_service: Payment Service",
            "app.inventory_service: Inventory Service",
            "app.notification_service: Notification Service",
            "app.logging_service: Logging Service",
            "app.monitoring_service: Monitoring Service",
            "app.config_service: Config Service",
            "app.cache_service: Cache Service",
            "app.search_service: Search Service",
            "app.analytics_service: Analytics Service",
            "app.report_service: Report Service",
            "app.backup_service: Backup Service",
            "app.scheduler_service: Scheduler Service",
            "app.email_service: Email Service"
        ])
        
        # Data tier (15 nodes)
        lines.extend([
            "data.user_db: User Database",
            "data.order_db: Order Database", 
            "data.payment_db: Payment Database",
            "data.inventory_db: Inventory Database",
            "data.analytics_db: Analytics Database",
            "data.logs_db: Logs Database",
            "data.cache_db: Cache Database",
            "data.session_db: Session Database",
            "data.config_db: Config Database",
            "data.backup_db: Backup Database",
            "data.search_index: Search Index",
            "data.file_storage: File Storage",
            "data.blob_storage: Blob Storage",
            "data.message_queue: Message Queue",
            "data.event_stream: Event Stream"
        ])
        
        # External services (10 nodes)
        lines.extend([
            "external.payment_gateway: Payment Gateway",
            "external.email_provider: Email Provider",
            "external.sms_provider: SMS Provider",
            "external.analytics_provider: Analytics Provider",
            "external.cdn_provider: CDN Provider",
            "external.monitoring_provider: Monitoring Provider",
            "external.backup_provider: Backup Provider",
            "external.auth_provider: Auth Provider",
            "external.api_partner: API Partner",
            "external.third_party_service: Third Party Service"
        ])
        
        # Add connections
        connections = [
            "web.load_balancer -> web.web_server_1: HTTP",
            "web.load_balancer -> web.web_server_2: HTTP",
            "web.load_balancer -> web.web_server_3: HTTP",
            "web.firewall -> web.load_balancer: Filtered Traffic",
            "web.cdn -> web.static_assets: Static Content",
            "web.api_gateway -> app.user_service: API Calls",
            "web.api_gateway -> app.order_service: API Calls",
            "web.auth_service -> data.user_db: User Auth",
            "web.session_store -> data.session_db: Session Data",
            "app.user_service -> data.user_db: User Data",
            "app.order_service -> data.order_db: Order Data",
            "app.payment_service -> data.payment_db: Payment Data",
            "app.payment_service -> external.payment_gateway: Payment Processing",
            "app.inventory_service -> data.inventory_db: Inventory Data",
            "app.notification_service -> external.email_provider: Email",
            "app.notification_service -> external.sms_provider: SMS",
            "app.logging_service -> data.logs_db: Log Data",
            "app.monitoring_service -> external.monitoring_provider: Metrics",
            "app.cache_service -> data.cache_db: Cache Data",
            "app.search_service -> data.search_index: Search Queries",
            "app.analytics_service -> data.analytics_db: Analytics Data",
            "app.backup_service -> data.backup_db: Backup Data",
            "app.backup_service -> external.backup_provider: External Backup",
            "data.message_queue -> app.notification_service: Messages",
            "data.event_stream -> app.analytics_service: Events"
        ]
        
        lines.extend(connections)
        return "\n".join(lines)
    
    def create_mock_d2json_response(self, num_nodes: int) -> Dict[str, Any]:
        """Create mock response from d2json with specified number of nodes."""
        nodes = []
        edges = []
        
        # Generate nodes
        for i in range(num_nodes):
            node_id = f"node_{i}"
            nodes.append({
                "id": node_id,
                "label": f"Node {i}",
                "x": (i % 10) * 150,
                "y": (i // 10) * 100,
                "width": 120,
                "height": 80
            })
        
        # Generate some edges
        for i in range(min(num_nodes - 1, 25)):  # Limit edges for performance
            edges.append({
                "Source": f"node_{i}",
                "Target": f"node_{i+1}",
                "Label": f"Connection {i}"
            })
        
        return {"nodes": nodes, "edges": edges}
    
    @patch('subprocess.run')
    def test_parse_and_validate_50_node_diagram(self, mock_subprocess):
        """Test parsing and validation of 50-node diagram."""
        # Create mock response
        mock_response = self.create_mock_d2json_response(50)
        mock_result = Mock()
        mock_result.stdout = json.dumps(mock_response).encode()
        mock_subprocess.return_value = mock_result
        
        # Create D2 sample
        d2_sample = self.create_50_node_d2_sample()
        
        # Parse diagram
        diagram = self.parser.parse(d2_sample)
        
        # Verify structure
        assert len(diagram.nodes) == 50
        assert len(diagram.edges) == 25
        
        # Validate all nodes have required fields
        for node in diagram.nodes:
            assert node.id is not None
            assert node.label is not None
            assert node.type == "generic"
            assert isinstance(node.x, float)
            assert isinstance(node.y, float)
            assert isinstance(node.width, float)
            assert isinstance(node.height, float)
        
        # Validate all edges have required fields
        for edge in diagram.edges:
            assert edge.id is not None
            assert edge.source is not None
            assert edge.target is not None
        
        # Run validation
        is_valid, errors = self.validator.validate(diagram)
        
        # Should be valid
        assert is_valid is True
        assert errors == []
    
    @patch('subprocess.run')
    def test_parse_and_validate_diagram_with_validation_errors(self, mock_subprocess):
        """Test parsing diagram that produces validation errors."""
        # Create mock response with problematic data
        mock_response = {
            "nodes": [
                {"id": "node1", "label": "Valid Node", "x": 0, "y": 0, "width": 100, "height": 60},
                {"id": "node2", "label": "Invalid@#$Node", "x": 100, "y": 0, "width": 100, "height": 60},
                {"id": "node3", "label": "data:image/png;base64,abc123", "x": 200, "y": 0, "width": 100, "height": 60}
            ],
            "edges": [
                {"Source": "node1", "Target": "node2", "Label": "Valid Edge"},
                {"Source": "node2", "Target": "node3", "Label": "Another Edge"}
            ]
        }
        
        mock_result = Mock()
        mock_result.stdout = json.dumps(mock_response).encode()
        mock_subprocess.return_value = mock_result
        
        # Parse diagram
        diagram = self.parser.parse("test diagram")
        
        # Should parse successfully
        assert len(diagram.nodes) == 3
        assert len(diagram.edges) == 2
        
        # But validation should fail
        is_valid, errors = self.validator.validate(diagram)
        
        assert is_valid is False
        assert len(errors) == 2  # node2: 1 error, node3: 1 error
        assert any("node2" in err for err in errors)
        assert any("node3" in err for err in errors)
    
    def test_performance_with_large_diagram(self):
        """Test performance considerations with large diagrams."""
        # Create large diagram manually (without subprocess)
        nodes = []
        edges = []
        
        # Create 100 nodes
        for i in range(100):
            nodes.append(DSLNode(
                id=f"node_{i}",
                label=f"Node {i}",
                type="generic",
                x=float(i % 20 * 100),
                y=float(i // 20 * 100),
                width=120.0,
                height=80.0
            ))
        
        # Create 50 edges
        for i in range(50):
            edges.append(DSLEdge(
                id=f"edge_{i}",
                source=f"node_{i}",
                target=f"node_{i+1}",
                label=f"Connection {i}"
            ))
        
        diagram = DSLDiagram(nodes=nodes, edges=edges)
        
        # Validation should complete in reasonable time
        import time
        start = time.time()
        is_valid, errors = self.validator.validate(diagram)
        end = time.time()
        
        assert is_valid is True
        assert errors == []
        assert end - start < 1.0  # Should complete within 1 second


class TestIntegrationFlow:
    """Integration tests for the complete parser -> validator flow."""
    
    def setup_method(self):
        self.parser = D2LangParser()
        self.validator = DiagramValidator()
    
    @patch('subprocess.run')
    def test_complete_flow_success(self, mock_subprocess):
        """Test complete flow from D2 text to validated diagram."""
        mock_result = Mock()
        mock_result.stdout = json.dumps({
            "nodes": [
                {"id": "frontend", "label": "Frontend App", "x": 0, "y": 0, "width": 150, "height": 100},
                {"id": "backend", "label": "Backend API", "x": 200, "y": 0, "width": 150, "height": 100},
                {"id": "database", "label": "Database", "x": 400, "y": 0, "width": 150, "height": 100}
            ],
            "edges": [
                {"Source": "frontend", "Target": "backend", "Label": "API Calls"},
                {"Source": "backend", "Target": "database", "Label": "SQL Queries"}
            ]
        }).encode()
        mock_subprocess.return_value = mock_result
        
        d2_text = """
        frontend: Frontend App
        backend: Backend API  
        database: Database
        
        frontend -> backend: API Calls
        backend -> database: SQL Queries
        """
        
        # Parse
        diagram = self.parser.parse(d2_text)
        
        # Validate
        is_valid, errors = self.validator.validate(diagram)
        
        assert is_valid is True
        assert errors == []
        assert len(diagram.nodes) == 3
        assert len(diagram.edges) == 2
    
    @patch('subprocess.run')
    def test_complete_flow_with_validation_failures(self, mock_subprocess):
        """Test complete flow where validation catches issues."""
        mock_result = Mock()
        mock_result.stdout = json.dumps({
            "nodes": [
                {"id": "node1", "label": "Good Node", "x": 0, "y": 0, "width": 100, "height": 60},
                {"id": "node2", "label": "Bad@Node#Label", "x": 100, "y": 0, "width": 100, "height": 60}
            ],
            "edges": []
        }).encode()
        mock_subprocess.return_value = mock_result
        
        # Parse (succeeds)
        diagram = self.parser.parse("node1; node2")
        
        # Validate (fails)
        is_valid, errors = self.validator.validate(diagram)
        
        assert is_valid is False
        assert len(errors) == 1
        assert "node2" in errors[0]
        assert "illegal label" in errors[0] 