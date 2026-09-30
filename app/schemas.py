"""Pydantic schemas for request/response validation"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ==================== Enums ====================

class DocumentStatus(str, Enum):
    """Document processing status"""
    UPLOADING = "uploading"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class SummaryType(str, Enum):
    """Summary type"""
    EXECUTIVE = "executive"
    DETAILED = "detailed"


class UserRole(str, Enum):
    """User roles"""
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


class LoginRequest(BaseModel):
    """User login request model"""
    email: str
    password: str
    organizationId: Optional[str] = "org_default"



class ValidationStatus(str, Enum):
    """Validation status"""
    VALID = "valid"
    PARTIAL = "partial"
    UNSUPPORTED = "unsupported"


# ==================== Document Schemas ====================

class DocumentUploadRequest(BaseModel):
    """Document upload request"""
    title: Optional[str] = None
    organization_id: str = Field(..., alias="organizationId")
    user_id: Optional[str] = Field(None, alias="userId")


class DocumentResponse(BaseModel):
    """Document response"""
    document_id: str = Field(..., alias="documentId")
    title: str
    file_name: str = Field(..., alias="fileName")
    status: DocumentStatus
    word_count: Optional[int] = Field(None, alias="wordCount")
    page_count: Optional[int] = Field(None, alias="pageCount")
    created_at: datetime = Field(..., alias="createdAt")
    
    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Document list response"""
    documents: List[DocumentResponse]
    total: int
    has_more: bool = Field(..., alias="hasMore")


# ==================== Summary Schemas ====================

class SummarySummaryConfig(BaseModel):
    """Summary configuration"""
    type: SummaryType = SummaryType.EXECUTIVE
    focus_area: Optional[str] = Field(None, alias="focusArea")
    language: Optional[str] = "en"


class SummarySummaryGenerateRequest(BaseModel):
    """Generate summary request"""
    document_id: str = Field(..., alias="documentId")
    organization_id: str = Field(..., alias="organizationId")
    user_id: Optional[str] = Field(None, alias="userId")
    config: Optional[SummarySummaryConfig] = None


class SummaryContent(BaseModel):
    """Summary content"""
    title: str
    summary: Optional[str] = None
    key_findings: Optional[List[str]] = Field(None, alias="keyFindings")
    risks: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    action_items: Optional[List[Dict[str, Any]]] = Field(None, alias="actionItems")
    conclusion: Optional[str] = None


class ValidationResult(BaseModel):
    """Validation result"""
    status: ValidationStatus
    confidence: float = Field(..., ge=0.0, le=1.0)


class QualityMetrics(BaseModel):
    """Quality metrics"""
    relevance_score: float = Field(..., alias="relevanceScore")
    completeness_score: float = Field(..., alias="completenessScore")
    overall_quality_score: float = Field(..., alias="overallQualityScore")


class CostBreakdown(BaseModel):
    """Cost breakdown"""
    extraction_cost: float = Field(..., alias="extractionCost")
    summary_token_count: int = Field(..., alias="summaryTokenCount")
    summarization_cost: float = Field(..., alias="summarizationCost")
    validation_cost: float = Field(..., alias="validationCost")
    total_cost: float = Field(..., alias="totalCost")


class SummaryResponse(BaseModel):
    """Summary response"""
    summary_id: str = Field(..., alias="summaryId")
    document_id: str = Field(..., alias="documentId")
    type: SummaryType
    content: SummaryContent
    validation: ValidationResult
    quality: QualityMetrics
    costs: CostBreakdown
    created_at: datetime = Field(..., alias="createdAt")
    
    class Config:
        from_attributes = True


class SummaryListResponse(BaseModel):
    """Summary list response"""
    summaries: List[Dict[str, Any]]
    total: int


# ==================== Cost Schemas ====================

class CostAnalyticsResponse(BaseModel):
    """Cost analytics response"""
    period: Dict[str, Any]
    total_cost: float = Field(..., alias="totalCost")
    average_cost_per_document: float = Field(..., alias="averageCostPerDocument")
    document_count: int = Field(..., alias="documentCount")
    cost_breakdown: Dict[str, float] = Field(..., alias="costBreakdown")
    roi: Dict[str, Any]


class BudgetStatus(BaseModel):
    """Budget status"""
    monthly_budget: float = Field(..., alias="monthlyBudget")
    spent: float
    remaining: float
    percent_used: float = Field(..., alias="percentUsed")
    alerts: List[Dict[str, str]]


class CostEstimateRequest(BaseModel):
    """Cost estimate request"""
    summary_type: SummaryType = Field(SummaryType.EXECUTIVE, alias="summaryType")


class CostEstimateResponse(BaseModel):
    """Cost estimate response"""
    document_id: str = Field(..., alias="documentId")
    word_count: int = Field(..., alias="wordCount")
    estimate: Dict[str, float]


# ==================== User & Auth Schemas ====================

class UserRegisterRequest(BaseModel):
    """User registration request"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    organization_id: Optional[str] = Field(None, alias="organizationId")


class UserLoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str = Field(..., alias="accessToken")
    refresh_token: Optional[str] = Field(None, alias="refreshToken")
    token_type: str = Field("bearer", alias="tokenType")
    expires_in: int = Field(..., alias="expiresIn")


class UserResponse(BaseModel):
    """User response"""
    user_id: str = Field(..., alias="userId")
    email: str
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    role: UserRole
    organization_id: str = Field(..., alias="organizationId")
    created_at: datetime = Field(..., alias="createdAt")
    
    class Config:
        from_attributes = True


# ==================== Organization Schemas ====================

class OrganizationCreateRequest(BaseModel):
    """Create organization request"""
    name: str
    slug: Optional[str] = None


class OrganizationResponse(BaseModel):
    """Organization response"""
    organization_id: str = Field(..., alias="organizationId")
    name: str
    slug: str
    members: List[Dict[str, Any]]
    created_at: datetime = Field(..., alias="createdAt")
    
    class Config:
        from_attributes = True


# ==================== Chat/Conversation Schemas ====================

class MessageRequest(BaseModel):
    """Message request for conversation"""
    content: str


class MessageResponse(BaseModel):
    """Message response"""
    role: str
    content: str
    timestamp: datetime


class ConversationResponse(BaseModel):
    """Conversation response"""
    conversation_id: str = Field(..., alias="conversationId")
    document_id: str = Field(..., alias="documentId")
    messages: List[MessageResponse]
    created_at: datetime = Field(..., alias="createdAt")
    
    class Config:
        from_attributes = True


# ==================== Health Check ====================

class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: datetime
    version: str
    database: Optional[str] = None
    cache: Optional[str] = None


class ReadinessResponse(BaseModel):
    """Readiness check response"""
    ready: bool
    database: Optional[str] = None
    cache: Optional[str] = None
    message: Optional[str] = None


# ==================== Error Schemas ====================

class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    status: int
    timestamp: datetime
    detail: Optional[str] = None
