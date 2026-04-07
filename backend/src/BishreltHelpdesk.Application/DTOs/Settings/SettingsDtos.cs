namespace BishreltHelpdesk.Application.DTOs.Settings;

// ── CallTypeConfig ──

public class CallTypeConfigResponse
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public string DefaultPriority { get; set; } = "Medium";
}

public class CreateCallTypeConfigRequest
{
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; } = 0;
    public string DefaultPriority { get; set; } = "Medium";
}

public class UpdateCallTypeConfigRequest
{
    public string Label { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public string DefaultPriority { get; set; } = "Medium";
}

// ── Company ──

public class CompanyResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; }
    public int TicketCount { get; set; }
    public int UserCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCompanyRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
}

public class UpdateCompanyRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; }
}

// ── Branding ──

public class BrandingConfig
{
    public string CompanyName { get; set; } = "BISHRELT";
    public string CompanySubtitle { get; set; } = "GROUP";
    public string LogoText { get; set; } = "BG";
}

public class UpdateBrandingRequest
{
    public string CompanyName { get; set; } = string.Empty;
    public string CompanySubtitle { get; set; } = string.Empty;
    public string LogoText { get; set; } = string.Empty;
}
