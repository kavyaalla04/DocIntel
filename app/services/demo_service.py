"""Demo Dataset Loader Service"""
import os
import logging
from typing import Dict, Any, List
import pandas as pd

from app import database
from app.services.extraction_service import extraction_service

logger = logging.getLogger(__name__)

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "train-00000-of-00002.parquet")


class DemoService:
    """Pre-populates sample demonstration documents into system"""

    async def load_demo_dataset(self, organization_id: str = "org_default", user_id: str = "user_default") -> List[Dict[str, Any]]:
        """Load representative demonstration documents including real Parquet GovReports"""
        demos = [
            {
                "title": "Q3 2026 Enterprise Financial & Operational Risk Report",
                "fileName": "Q3_Financial_Risk_Report.pdf",
                "fileType": "application/pdf",
                "text": (
                    "EXECUTIVE FINANCIAL AND OPERATIONAL RISK BRIEFING Q3 2026\n\n"
                    "1. FINANCIAL PERFORMANCE\n"
                    "Total revenue reached $48.2M, representing a 16.4% year-over-year increase driven by cloud service adoption. "
                    "Operating expenses rose by 8.2% to $31.5M due to infrastructure scaling and security compliance investments.\n\n"
                    "2. KEY RISKS AND HAZARDS\n"
                    "Risk 1: Cloud latency across European edge nodes created a 2.4% SLA breach window in August.\n"
                    "Risk 2: Regulatory compliance updates require ISO 27001 re-certification by Q4 2026.\n"
                    "Risk 3: Talent retention in AI security engineering presents operational headwinds.\n\n"
                    "3. RECOMMENDATIONS & DECISIONS\n"
                    "Decision 1: Approved $4.2M capital allocation for automated threat detection and vector database scaling.\n"
                    "Recommendation: Mandatory multi-factor authentication across all third-party integration endpoints within 30 days."
                )
            },
            {
                "title": "Global HR & Remote Work Policy Guidelines 2026",
                "fileName": "HR_Remote_Policy_2026.docx",
                "fileType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "text": (
                    "GLOBAL HUMAN RESOURCES & FLEXIBLE WORK POLICY 2026\n\n"
                    "Section 1: Work Environment Flexibility\n"
                    "Employees may choose hybrid or fully remote schedules subject to manager approval and core hours availability.\n\n"
                    "Section 2: Equipment Allowance & Benefits\n"
                    "Each employee receives a $1,200 annual stipend for ergonomic home office technology and high-speed broadband.\n\n"
                    "Section 3: Compliance & Security Requirements\n"
                    "All remote devices must run managed endpoint protection. Public Wi-Fi usage requires corporate VPN connection at all times."
                )
            },
            {
                "title": "GovReport Long Government Benchmark - Infrastructure Modernization",
                "fileName": "GovReport_Infrastructure_2026.txt",
                "fileType": "text/plain",
                "text": (
                    "CONGRESSIONAL RESEARCH SERVICE REPORT - PUBLIC INFRASTRUCTURE & CYBER RESILIENCE\n\n"
                    "Abstract: This report evaluates federal funding allocations across 50 state transport and IT networks. "
                    "Key findings indicate that legacy software components introduce substantial security exposure, accounting for 64% of zero-day vulnerabilities. "
                    "The committee recommends an expedited 3-year phased migration to cloud-native zero-trust architectures, backed by $18.5 Billion in federal grants."
                )
            },
            {
                "title": "Noisy OCR Stress-Test Scan Sample",
                "fileName": "Noisy_OCR_Sample.pdf",
                "fileType": "application/pdf",
                "text": (
                    "PAGE 1 OF 10 - CONFIDENTIAL DOCUMENT - WWW.SAMPLE.COM\n"
                    "00984123\n\n"
                    "SYMMARY REPORT - SY STEM AUDIT\n"
                    "Th e system audit identified minor non-conformance in database index optimization .\n"
                    "PAGE 1 OF 10 - CONFIDENTIAL DOCUMENT - WWW.SAMPLE.COM\n\n"
                    "Recommendation: Execute automated re-indexing during low-traffic maintenance window."
                )
            }
        ]

        # Load samples from parquet if available
        if os.path.exists(DATA_PATH):
            try:
                df = pd.read_parquet(DATA_PATH, columns=["report", "summary"])
                for i in range(min(2, len(df))):
                    rep_text = str(df.iloc[i]["report"])
                    first_line = rep_text.strip().split("\n")[0][:80]
                    demos.append({
                        "title": f"GAO GovReport #{i+1}: {first_line}",
                        "fileName": f"GovReport_Parquet_Sample_{i+1}.txt",
                        "fileType": "text/plain",
                        "text": rep_text[:15000]
                    })
            except Exception as e:
                logger.error(f"Failed loading parquet into demo dataset: {e}")

        created_docs = []
        for demo in demos:
            cleaned_text, report = await extraction_service.clean_extracted_text_with_report(demo["text"])
            metadata = await extraction_service.extract_metadata(cleaned_text, demo["fileName"])
            chunks = await extraction_service.chunk_text_hierarchical(cleaned_text)
            
            doc_data = {
                "organizationId": organization_id,
                "ownerId": user_id,
                "title": demo["title"],
                "fileName": demo["fileName"],
                "fileType": demo["fileType"],
                "s3Key": f"demo/{demo['fileName']}",
                "fileSize": len(demo["text"].encode('utf-8')),
                "processingStatus": "completed",
                "extractedText": demo["text"],
                "cleanedText": cleaned_text,
                "cleaningReport": report,
                "pageCount": metadata["pageEstimate"],
                "wordCount": metadata["wordCount"],
                "chunks": chunks,
                "isDemo": True
            }
            doc_id = await database.create_document(doc_data)
            created_docs.append({**doc_data, "documentId": doc_id})

        return created_docs


demo_service = DemoService()

