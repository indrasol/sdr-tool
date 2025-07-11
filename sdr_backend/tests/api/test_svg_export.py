import pytest
from unittest.mock import patch, Mock, AsyncMock
from fastapi.testclient import TestClient
from fastapi import FastAPI
from io import BytesIO

from v2.api.routes.model_with_ai.svg_export import router, D2Source, SUPPORTED_THEMES


@pytest.fixture
def app():
    """Create test FastAPI app with SVG export routes."""
    app = FastAPI()
    app.include_router(router, prefix="/v2/design")
    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def mock_user():
    """Mock authenticated user."""
    return {"id": "test_user_123", "email": "test@example.com"}


@pytest.fixture
def sample_d2_dsl():
    """Sample valid D2 DSL."""
    return """
    user: "User"
    web_app: "Web Application"
    database: "Database"
    
    user -> web_app
    web_app -> database
    """


class TestD2Source:
    """Test D2Source request model validation."""
    
    def test_valid_d2_source(self):
        """Test valid D2Source creation."""
        source = D2Source(
            dsl="user: \"User\"\napi: \"API\"\nuser -> api",
            theme="0"
        )
        assert source.dsl == "user: \"User\"\napi: \"API\"\nuser -> api"
        assert source.theme == "0"
    
    def test_default_theme(self):
        """Test default theme assignment."""
        source = D2Source(dsl="user: \"User\"")
        assert source.theme == "0"
    
    def test_empty_dsl_validation(self):
        """Test empty DSL validation."""
        with pytest.raises(ValueError, match="DSL content cannot be empty"):
            D2Source(dsl="")
    
    def test_whitespace_only_dsl_validation(self):
        """Test whitespace-only DSL validation."""
        with pytest.raises(ValueError, match="DSL content cannot be empty"):
            D2Source(dsl="   \n\t  ")
    
    def test_excessive_lines_validation(self):
        """Test validation of DSL with too many lines."""
        long_dsl = "\n".join([f"node_{i}: \"Node {i}\"" for i in range(501)])
        with pytest.raises(ValueError, match="too many lines"):
            D2Source(dsl=long_dsl)
    
    def test_dangerous_content_validation(self):
        """Test validation of potentially dangerous content."""
        dangerous_patterns = [
            "import os",
            "include <stdio.h>",
            "exec('rm -rf /')",
            "system('ls')",
            "eval(input())",
            "subprocess.call",
            "os.system",
            "file:///etc/passwd",
            "http://malicious.com",
            "https://evil.org"
        ]
        
        for pattern in dangerous_patterns:
            with pytest.raises(ValueError, match="potentially unsafe content"):
                D2Source(dsl=f"user: \"User\"\n{pattern}")
    
    def test_invalid_theme_validation(self):
        """Test invalid theme validation."""
        with pytest.raises(ValueError, match="Unsupported theme"):
            D2Source(dsl="user: \"User\"", theme="999")
    
    def test_valid_themes(self):
        """Test all supported themes are valid."""
        for theme_id in SUPPORTED_THEMES.keys():
            source = D2Source(dsl="user: \"User\"", theme=theme_id)
            assert source.theme == theme_id


class TestSVGExport:
    """Test SVG export endpoint functionality."""
    
    @patch('v2.api.routes.model_with_ai.svg_export.verify_token')
    @patch('v2.api.routes.model_with_ai.svg_export._parser')
    @patch('v2.api.routes.model_with_ai.svg_export._validator')
    @patch('v2.api.routes.model_with_ai.svg_export.render_svg')
    def test_successful_svg_export(self, mock_render_svg, mock_validator, mock_parser, mock_verify_token, client, mock_user, sample_d2_dsl):
        """Test successful SVG export."""
        # Setup mocks
        mock_verify_token.return_value = mock_user
        mock_diagram = Mock()
        mock_diagram.nodes = [Mock(), Mock()]
        mock_diagram.edges = [Mock()]
        mock_parser.parse.return_value = mock_diagram
        mock_validator.validate.return_value = (True, [])
        mock_render_svg.return_value = b"<svg>test svg content</svg>"
        
        response = client.post(
            "/v2/design/svg",
            json={"dsl": sample_d2_dsl, "theme": "0"}
        )
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/svg+xml"
        assert b"<svg>test svg content</svg>" in response.content
        assert "Cache-Control" in response.headers
        
        # Verify mocks were called correctly
        mock_parser.parse.assert_called_once_with(sample_d2_dsl)
        mock_validator.validate.assert_called_once_with(mock_diagram)
        mock_render_svg.assert_called_once_with(sample_d2_dsl, theme="0")
    
    @patch('v2.api.routes.model_with_ai.svg_export.verify_token')
    @patch('v2.api.routes.model_with_ai.svg_export._parser')
    @patch('v2.api.routes.model_with_ai.svg_export._validator')
    @patch('v2.api.routes.model_with_ai.svg_export.render_svg')
    def test_svg_export_with_download(self, mock_render_svg, mock_validator, mock_parser, mock_verify_token, client, mock_user, sample_d2_dsl):
        """Test SVG export with download option."""
        # Setup mocks
        mock_verify_token.return_value = mock_user
        mock_diagram = Mock()
        mock_parser.parse.return_value = mock_diagram
        mock_validator.validate.return_value = (True, [])
        mock_render_svg.return_value = b"<svg>test svg content</svg>"
        
        response = client.post(
            "/v2/design/svg?download=true",
            json={"dsl": sample_d2_dsl, "theme": "101"}
        )
        
        assert response.status_code == 200
        assert "Content-Disposition" in response.headers
        assert "attachment" in response.headers["Content-Disposition"]
        assert "diagram_theme_101.svg" in response.headers["Content-Disposition"]
    
    @patch('v2.api.routes.model_with_ai.svg_export.verify_token')
    @patch('v2.api.routes.model_with_ai.svg_export._parser')
    def test_svg_export_dsl_parsing_error(self, mock_parser, mock_verify_token, client, mock_user):
        """Test SVG export with DSL parsing error."""
        mock_verify_token.return_value = mock_user
        mock_parser.parse.side_effect = ValueError("D2 compilation failed: syntax error")
        
        response = client.post(
            "/v2/design/svg",
            json={"dsl": "invalid dsl content", "theme": "0"}
        )
        
        assert response.status_code == 422
        data = response.json()
        assert data["detail"]["error_code"] == "DSL_PARSING_FAILED"
        assert "D2 DSL parsing failed" in data["detail"]["message"]
        assert "supported_themes" in data["detail"]
    
    @patch('v2.api.routes.model_with_ai.svg_export.verify_token')
    @patch('v2.api.routes.model_with_ai.svg_export._parser')
    @patch('v2.api.routes.model_with_ai.svg_export._validator')
    def test_svg_export_validation_error(self, mock_validator, mock_parser, mock_verify_token, client, mock_user, sample_d2_dsl):
        """Test SVG export with diagram validation error."""
        mock_verify_token.return_value = mock_user
        mock_diagram = Mock()
        mock_parser.parse.return_value = mock_diagram
        mock_validator.validate.return_value = (False, ["Invalid label format", "Missing iconifyId"])
        
        response = client.post(
            "/v2/design/svg",
            json={"dsl": sample_d2_dsl, "theme": "0"}
        )
        
        assert response.status_code == 422
        data = response.json()
        assert data["detail"]["error_code"] == "DIAGRAM_VALIDATION_FAILED"
        assert "Invalid label format" in data["detail"]["errors"]
        assert "Missing iconifyId" in data["detail"]["errors"]
    
    @patch('v2.api.routes.model_with_ai.svg_export.verify_token')
    @patch('v2.api.routes.model_with_ai.svg_export._parser')
    @patch('v2.api.routes.model_with_ai.svg_export._validator')
    @patch('v2.api.routes.model_with_ai.svg_export.render_svg')
    def test_svg_export_render_error(self, mock_render_svg, mock_validator, mock_parser, mock_verify_token, client, mock_user, sample_d2_dsl):
        """Test SVG export with rendering error."""
        mock_verify_token.return_value = mock_user
        mock_diagram = Mock()
        mock_parser.parse.return_value = mock_diagram
        mock_validator.validate.return_value = (True, [])
        mock_render_svg.side_effect = Exception("SVG rendering timeout")
        
        response = client.post(
            "/v2/design/svg",
            json={"dsl": sample_d2_dsl, "theme": "0"}
        )
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"]["error_code"] == "SVG_RENDER_ERROR"
        assert "SVG rendering failed" in data["detail"]["message"]
    
    @patch('v2.api.routes.model_with_ai.svg_export.verify_token')
    @patch('v2.api.routes.model_with_ai.svg_export._parser')
    @patch('v2.api.routes.model_with_ai.svg_export._validator')
    @patch('v2.api.routes.model_with_ai.svg_export.render_svg')
    def test_svg_export_empty_render(self, mock_render_svg, mock_validator, mock_parser, mock_verify_token, client, mock_user, sample_d2_dsl):
        """Test SVG export with empty rendering result."""
        mock_verify_token.return_value = mock_user
        mock_diagram = Mock()
        mock_parser.parse.return_value = mock_diagram
        mock_validator.validate.return_value = (True, [])
        mock_render_svg.return_value = b""  # Empty result
        
        response = client.post(
            "/v2/design/svg",
            json={"dsl": sample_d2_dsl, "theme": "0"}
        )
        
        assert response.status_code == 500
        data = response.json()
        assert data["detail"]["error_code"] == "SVG_RENDER_FAILED"
        assert "empty content" in data["detail"]["message"]
    
    def test_svg_export_invalid_request_data(self, client):
        """Test SVG export with invalid request data."""
        response = client.post(
            "/v2/design/svg",
            json={"dsl": "", "theme": "invalid"}  # Empty DSL and invalid theme
        )
        
        assert response.status_code == 422
        # Should catch validation error from pydantic


class TestSVGThemes:
    """Test SVG themes endpoint."""
    
    @patch('v2.api.routes.model_with_ai.svg_export.verify_token')
    def test_get_supported_themes(self, mock_verify_token, client, mock_user):
        """Test getting supported themes."""
        mock_verify_token.return_value = mock_user
        
        response = client.get("/v2/design/svg/themes")
        
        assert response.status_code == 200
        data = response.json()
        assert "themes" in data
        assert "default_theme" in data
        assert "total_themes" in data
        assert data["default_theme"] == "0"
        assert data["total_themes"] == len(SUPPORTED_THEMES)
        assert data["themes"]["0"] == "Neutral default"
        assert data["themes"]["101"] == "Terminal grayscale"


class TestSVGPreview:
    """Test SVG preview endpoint."""
    
    @patch('v2.api.routes.model_with_ai.svg_export.verify_token')
    @patch('v2.api.routes.model_with_ai.svg_export._parser')
    @patch('v2.api.routes.model_with_ai.svg_export._validator')
    def test_svg_preview_valid(self, mock_validator, mock_parser, mock_verify_token, client, mock_user, sample_d2_dsl):
        """Test SVG preview for valid diagram."""
        mock_verify_token.return_value = mock_user
        mock_diagram = Mock()
        mock_diagram.nodes = [Mock() for _ in range(5)]  # 5 nodes
        mock_diagram.edges = [Mock() for _ in range(3)]  # 3 edges
        mock_parser.parse.return_value = mock_diagram
        mock_validator.validate.return_value = (True, [])
        
        response = client.post(
            "/v2/design/svg/preview",
            json={"dsl": sample_d2_dsl, "theme": "200"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["errors"] == []
        assert data["theme"] == "200"
        assert data["theme_name"] == "Origami"
        assert data["node_count"] == 5
        assert data["edge_count"] == 3
        assert data["complexity_level"] == "simple"
        assert data["export_ready"] is True
        assert "estimated_size_kb" in data
    
    @patch('v2.api.routes.model_with_ai.svg_export.verify_token')
    @patch('v2.api.routes.model_with_ai.svg_export._parser')
    @patch('v2.api.routes.model_with_ai.svg_export._validator')
    def test_svg_preview_invalid(self, mock_validator, mock_parser, mock_verify_token, client, mock_user, sample_d2_dsl):
        """Test SVG preview for invalid diagram."""
        mock_verify_token.return_value = mock_user
        mock_diagram = Mock()
        mock_parser.parse.return_value = mock_diagram
        mock_validator.validate.return_value = (False, ["Invalid node label", "Missing iconifyId"])
        
        response = client.post(
            "/v2/design/svg/preview",
            json={"dsl": sample_d2_dsl, "theme": "0"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert "Invalid node label" in data["errors"]
        assert "Missing iconifyId" in data["errors"]
        assert data["theme"] == "0"
    
    @patch('v2.api.routes.model_with_ai.svg_export.verify_token')
    @patch('v2.api.routes.model_with_ai.svg_export._parser')
    @patch('v2.api.routes.model_with_ai.svg_export._validator')
    def test_svg_preview_complex_diagram(self, mock_validator, mock_parser, mock_verify_token, client, mock_user):
        """Test SVG preview for complex diagram."""
        mock_verify_token.return_value = mock_user
        mock_diagram = Mock()
        mock_diagram.nodes = [Mock() for _ in range(25)]  # 25 nodes (complex)
        mock_diagram.edges = [Mock() for _ in range(35)]  # 35 edges (complex)
        mock_parser.parse.return_value = mock_diagram
        mock_validator.validate.return_value = (True, [])
        
        response = client.post(
            "/v2/design/svg/preview",
            json={"dsl": "complex dsl...", "theme": "0"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["complexity_level"] == "complex"
        assert data["node_count"] == 25
        assert data["edge_count"] == 35
    
    @patch('v2.api.routes.model_with_ai.svg_export.verify_token')
    @patch('v2.api.routes.model_with_ai.svg_export._parser')
    def test_svg_preview_parsing_error(self, mock_parser, mock_verify_token, client, mock_user):
        """Test SVG preview with parsing error."""
        mock_verify_token.return_value = mock_user
        mock_parser.parse.side_effect = ValueError("Invalid D2 syntax")
        
        response = client.post(
            "/v2/design/svg/preview",
            json={"dsl": "invalid dsl", "theme": "0"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert "Invalid D2 syntax" in data["errors"]
        assert data["export_ready"] is False


class TestSVGExportSecurity:
    """Test security aspects of SVG export."""
    
    @patch('v2.api.routes.model_with_ai.svg_export.verify_token')
    def test_authentication_required(self, mock_verify_token, client):
        """Test that authentication is required for all endpoints."""
        mock_verify_token.side_effect = Exception("Authentication failed")
        
        # Test main export endpoint
        response = client.post("/v2/design/svg", json={"dsl": "user: \"User\""})
        assert response.status_code == 500  # Exception from mock
        
        # Test themes endpoint
        response = client.get("/v2/design/svg/themes")
        assert response.status_code == 500  # Exception from mock
        
        # Test preview endpoint
        response = client.post("/v2/design/svg/preview", json={"dsl": "user: \"User\""})
        assert response.status_code == 500  # Exception from mock
    
    def test_input_sanitization(self):
        """Test that dangerous input is caught by validation."""
        dangerous_inputs = [
            "user: \"User\"\nimport os\nos.system('rm -rf /')",
            "user: \"User\"\nexec('malicious_code')",
            "user: \"User\"\nsubprocess.call(['rm', '-rf', '/'])",
            "user: \"User\"\nfile:///etc/passwd",
            "user: \"User\"\nhttp://malicious.com/evil.js"
        ]
        
        for dangerous_input in dangerous_inputs:
            with pytest.raises(ValueError, match="potentially unsafe content"):
                D2Source(dsl=dangerous_input)
    
    def test_request_size_limits(self):
        """Test that request size limits are enforced."""
        # Test DSL size limit
        huge_dsl = "user: \"User\"\n" + "a" * 60000  # Exceeds 50000 char limit
        with pytest.raises(ValueError):
            D2Source(dsl=huge_dsl)
    
    def test_response_headers_security(self, client):
        """Test that appropriate security headers are set."""
        with patch('v2.api.routes.model_with_ai.svg_export.verify_token') as mock_verify:
            with patch('v2.api.routes.model_with_ai.svg_export._parser') as mock_parser:
                with patch('v2.api.routes.model_with_ai.svg_export._validator') as mock_validator:
                    with patch('v2.api.routes.model_with_ai.svg_export.render_svg') as mock_render:
                        mock_verify.return_value = {"id": "test_user"}
                        mock_parser.parse.return_value = Mock()
                        mock_validator.validate.return_value = (True, [])
                        mock_render.return_value = b"<svg>test</svg>"
                        
                        response = client.post("/v2/design/svg", json={"dsl": "user: \"User\""})
                        
                        assert response.status_code == 200
                        # Check security headers
                        assert "X-Content-Type-Options" in response.headers
                        assert response.headers["X-Content-Type-Options"] == "nosniff"
                        assert "Cache-Control" in response.headers


class TestSVGExportIntegration:
    """Integration tests for SVG export functionality."""
    
    @patch('v2.api.routes.model_with_ai.svg_export.verify_token')
    @patch('v2.api.routes.model_with_ai.svg_export.render_svg')
    def test_end_to_end_svg_export(self, mock_render_svg, mock_verify_token, client, mock_user):
        """Test complete end-to-end SVG export flow."""
        mock_verify_token.return_value = mock_user
        mock_render_svg.return_value = b"<svg><g>test diagram</g></svg>"
        
        # Test a realistic D2 diagram
        realistic_dsl = """
        user: "User" {
          shape: person
        }
        
        webapp: "Web Application" {
          shape: cloud
        }
        
        database: "Database" {
          shape: cylinder
        }
        
        user -> webapp: "HTTPS"
        webapp -> database: "SQL"
        """
        
        response = client.post(
            "/v2/design/svg",
            json={"dsl": realistic_dsl, "theme": "2"}
        )
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/svg+xml"
        assert b"<svg><g>test diagram</g></svg>" in response.content
    
    @patch('v2.api.routes.model_with_ai.svg_export.verify_token')
    def test_theme_consistency(self, mock_verify_token, client, mock_user):
        """Test that theme information is consistent across endpoints."""
        mock_verify_token.return_value = mock_user
        
        # Get supported themes
        themes_response = client.get("/v2/design/svg/themes")
        themes_data = themes_response.json()
        
        # Test preview with each theme
        for theme_id in list(themes_data["themes"].keys())[:3]:  # Test first 3 themes
            with patch('v2.api.routes.model_with_ai.svg_export._parser') as mock_parser:
                with patch('v2.api.routes.model_with_ai.svg_export._validator') as mock_validator:
                    mock_parser.parse.return_value = Mock(nodes=[Mock()], edges=[Mock()])
                    mock_validator.validate.return_value = (True, [])
                    
                    preview_response = client.post(
                        "/v2/design/svg/preview",
                        json={"dsl": "user: \"User\"", "theme": theme_id}
                    )
                    
                    assert preview_response.status_code == 200
                    preview_data = preview_response.json()
                    assert preview_data["theme"] == theme_id
                    assert preview_data["theme_name"] == themes_data["themes"][theme_id] 