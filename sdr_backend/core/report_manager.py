
from config.settings import REPORTS_DIR
from datetime import datetime
import uuid
import os
from typing import Dict, List
from models.pydantic_models import SecurityAnalysisResponse, ReportMetadata
import json
from utils.logger import log_info

class ReportManager:
    def __init__(self):
        self.reports_dir = "reports"
        # Ensure reports directory structure exists
        os.makedirs(os.path.join(self.reports_dir, "images"), exist_ok=True)
    
    async def create_report(self, analysis_results: SecurityAnalysisResponse, image_path: str) -> str:
        """
        Creates a markdown report based on the security analysis results.
        
        Args:
            analysis_results: SecurityAnalysisResponse object containing gaps and recommendations
            image_path: Path to the architecture diagram image
            
        Returns:
            report_id: Unique identifier for the generated report
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_id = f"report_{timestamp}_{uuid.uuid4().hex[:8]}"
            log_info(f"Creating report with ID: {report_id}")
            # Generate markdown content
            markdown_content = await self._generate_markdown(analysis_results, image_path, report_id)
        except Exception as e:
            log_info(f"Error creating report: {str(e)}")
            raise e
            
        # Save report
        report_path = os.path.join(self.reports_dir, f"{report_id}.md")
        with open(report_path, "w") as f:
            f.write(markdown_content)
        
        return report_id
    
    async def _generate_markdown(
        self, 
        analysis_results: SecurityAnalysisResponse, 
        image_path: str, 
        report_id: str
    ) -> str:
        """
        Generates a formatted markdown report with the analysis results.
        """
        # Format lists with proper markdown syntax
        gaps_list = "\n".join([f"- **{gap}**" for gap in analysis_results.identified_gaps])
        recommendations_list = "\n".join(
            [f"- {rec}" for rec in analysis_results.recommendations]
        )

        # Use f-string with proper indentation and markdown formatting
        markdown_content = f"""# Security Architecture Review Report

            ## Report Information
            - **Report ID:** {report_id}
            - **Generated Date:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

            ## Architecture Diagram
            ![Architecture Diagram](/reports/images/{os.path.basename(image_path)})

            ## Executive Summary
            This security architecture review analyzes the provided system design for potential security gaps and provides actionable recommendations to enhance the system's security posture.

            **Key Findings:**
            - Found {len(analysis_results.identified_gaps)} critical security gaps
            - {len(analysis_results.recommendations)} prioritized recommendations
            - Immediate action required on high-risk items

            ## Identified Security Gaps
            {gaps_list}

            ## Security Recommendations
            {recommendations_list}

            **Example Remediation Plan:**
            - Critical fixes: Within 7 days
            - High-risk items: Within 14 days
            - Medium-risk items: Within 30 days

            ## Next Steps
            - **Review and prioritize the identified security gaps**    
            - **Implement the recommended security controls**
            - **Conduct regular security assessments to ensure continued compliance**
            - **Update security documentation to reflect implemented changes**

            ## Disclaimer
            This report is generated based on automated analysis of the provided architecture diagram. 
            We recommend thorough review and validation of the findings by security experts before implementation."""
            # Clean up any potential extra whitespace or inconsistent line breaks
        # cleaned_content = "\n".join(line.strip() for line in markdown_content.splitlines())
        return "\n".join([line.strip() for line in markdown_content.splitlines()])

    async def _format_list(self, title: str, items: List[str]) -> str:
        """
        Formats a list of items into a markdown section with bullet points.
        """
        if not items:
            return f"\n## {title}\nNo items identified.\n"
        
        formatted_items = "\n".join(f"- {item}" for item in items)
        return f"\n## {title}\n{formatted_items}\n"

    async def get_report_path(self, report_id: str) -> str:
        """
        Gets the full path for a report by its ID.
        """
        return os.path.join(self.reports_dir, f"{report_id}.md")

    async def update_report(self, report_id: str, content: str) -> None:
        """
        Updates an existing report with new content.
        """
        report_path = await self.get_report_path(report_id)
        with open(report_path, "w") as f:
            f.write(content)

    async def delete_report(self, report_id: str) -> None:
        """
        Deletes a report by its ID.
        """
        report_path = await self.get_report_path(report_id)
        if os.path.exists(report_path):
            os.remove(report_path)
    
    async def get_report_metadata_path(self, report_id: str) -> str:
        """Get the path for report metadata file"""
        return os.path.join(REPORTS_DIR, f"{report_id}.meta.json")

    async def load_report_metadata(self, report_id: str) -> ReportMetadata:
        """Load metadata for a report, creating it if it doesn't exist"""
        metadata_path = await self.get_report_metadata_path(report_id)
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                data = json.load(f)
                data['last_modified'] = datetime.fromisoformat(data['last_modified'])
                return ReportMetadata(**data)
        return ReportMetadata(
            last_modified=datetime.now(),
            version=1,
            editor=None,
            edit_comment=None
        )

    async def save_report_metadata(self, report_id: str, metadata: ReportMetadata):
        """Save metadata for a report"""
        metadata_path = await self.get_report_metadata_path(report_id)
        with open(metadata_path, 'w') as f:
            json.dump({
                **metadata.dict(),
                'last_modified': metadata.last_modified.isoformat()
            }, f)
