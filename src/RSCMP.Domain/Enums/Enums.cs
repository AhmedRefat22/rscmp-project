namespace RSCMP.Domain.Enums;

public enum UserRole
{
    Public = 0,
    Reviewer = 1,
    Chairman = 2,
    Admin = 3
}

public enum ResearchStatus
{
    Draft = 0,
    Submitted = 1,
    UnderReview = 2,
    ReviewCompleted = 3,
    Approved = 4,
    Rejected = 5,
    RevisionRequired = 6
}

public enum ReviewStatus
{
    Pending = 0,
    InProgress = 1,
    Completed = 2,
    Declined = 3,
    Returned = 4
}

public enum DecisionType
{
    Approved = 0,
    Rejected = 1,
    RevisionRequired = 2
}

public enum Language
{
    English = 0,
    Arabic = 1
}

public enum NotificationType
{
    Info = 0,
    Success = 1,
    Warning = 2,
    Error = 3
}

public enum ContactMessageStatus
{
    New = 0,
    Read = 1,
    Replied = 2,
    Archived = 3
}
