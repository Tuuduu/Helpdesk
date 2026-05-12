namespace BishreltHelpdesk.Application.DTOs.Vendors;

// ── VendorType ──

public class VendorTypeResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public int VendorCount { get; set; }
}

public class CreateVendorTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
}

public class UpdateVendorTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}

// ── VendorContact ──

public class VendorContactResponse
{
    public Guid Id { get; set; }
    public Guid VendorTypeId { get; set; }
    public string VendorTypeName { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? AccountManager { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public bool ShowOnLoginPage { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateVendorContactRequest
{
    public Guid VendorTypeId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? AccountManager { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Description { get; set; }
    public bool ShowOnLoginPage { get; set; }
}

public class UpdateVendorContactRequest
{
    public Guid VendorTypeId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? AccountManager { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public bool ShowOnLoginPage { get; set; }
}
