using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Application.DTOs.Computers;

public class CreateComputerRequest
{
    public ComputerKind Kind { get; set; } = ComputerKind.Desktop;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string? Monitor { get; set; }
    public string Cpu { get; set; } = string.Empty;
    public int RamGb { get; set; }
    public string? Gpu { get; set; }
    public string? DomainName { get; set; }
    public Guid OwnerUserId { get; set; }
    public string Position { get; set; } = string.Empty;
    public string? Department { get; set; }
    public Guid CompanyId { get; set; }
    public List<ComputerStorageInput> Storages { get; set; } = new();
    public List<ComputerMacAddressInput> MacAddresses { get; set; } = new();
    public List<ComputerAccessoryInput> Accessories { get; set; } = new();
}

public class UpdateComputerRequest
{
    public ComputerKind Kind { get; set; } = ComputerKind.Desktop;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string? Monitor { get; set; }
    public string Cpu { get; set; } = string.Empty;
    public int RamGb { get; set; }
    public string? Gpu { get; set; }
    public string? DomainName { get; set; }
    public string Position { get; set; } = string.Empty;
    public string? Department { get; set; }
    public ComputerStatus Status { get; set; }
    public List<ComputerStorageInput> Storages { get; set; } = new();
    public List<ComputerMacAddressInput> MacAddresses { get; set; } = new();
    public List<ComputerAccessoryInput> Accessories { get; set; } = new();
}

public class ComputerAccessoryInput
{
    public string Name { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class ComputerAccessoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class ComputerStorageInput
{
    public StorageType Type { get; set; }
    public int CapacityGb { get; set; }
    public string? ModelName { get; set; }
}

public class ComputerStorageDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public int CapacityGb { get; set; }
    public string? ModelName { get; set; }
}

public class ComputerMacAddressInput
{
    public MacAddressType Type { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? Label { get; set; }
    public bool IsPrimary { get; set; }
}

public class ComputerMacAddressDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Label { get; set; }
    public bool IsPrimary { get; set; }
}

public class ComputerImageDto
{
    public Guid Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class ComputerListItem
{
    public Guid Id { get; set; }
    public string AssetCode { get; set; } = string.Empty;
    public string Kind { get; set; } = "Desktop";
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Cpu { get; set; } = string.Empty;
    public int RamGb { get; set; }
    /// <summary>Primary (or first) MAC address for list display.</summary>
    public string MacAddress { get; set; } = string.Empty;
    public string? DomainName { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? PrimaryImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ComputerResponse : ComputerListItem
{
    public Guid OwnerUserId { get; set; }
    public Guid CompanyId { get; set; }
    public string? Monitor { get; set; }
    public string? Gpu { get; set; }
    public string? Department { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<ComputerStorageDto> Storages { get; set; } = new();
    public List<ComputerImageDto> Images { get; set; } = new();
    public List<ComputerMacAddressDto> MacAddresses { get; set; } = new();
    public List<ComputerAccessoryDto> Accessories { get; set; } = new();
}

public class ComputerFilterRequest : PagedRequest
{
    public ComputerStatus? Status { get; set; }
    public Guid? CompanyId { get; set; }
    public Guid? OwnerUserId { get; set; }
    public string? Brand { get; set; }
    public string? Search { get; set; }
}

public class ComputerDashboardResponse
{
    public int TotalCount { get; set; }
    public int ActiveCount { get; set; }
    public int InRepairCount { get; set; }
    public int InTransferCount { get; set; }
    public int RetiredCount { get; set; }
    public double AverageRamGb { get; set; }
    public double AverageAgeDays { get; set; }
    public int TransfersLast30Days { get; set; }
    public List<NameCountPair> ByCompany { get; set; } = new();
    public List<NameCountPair> ByBrand { get; set; } = new();
}

public class NameCountPair
{
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class ComputerReportFilterRequest
{
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public Guid? CompanyId { get; set; }
    public ComputerStatus? Status { get; set; }
    public ComputerKind? Kind { get; set; }
    public string? Brand { get; set; }
    public string? Department { get; set; }
}

public class ComputerReportSummary
{
    public int TotalCount { get; set; }
    public int ActiveCount { get; set; }
    public int InRepairCount { get; set; }
    public int InTransferCount { get; set; }
    public int RetiredCount { get; set; }
    public double AverageRamGb { get; set; }
    public double AverageAgeDays { get; set; }
    public List<ComputerReportRow> Rows { get; set; } = new();
}

public class ComputerReportRow
{
    public string AssetCode { get; set; } = string.Empty;
    public string Kind { get; set; } = "Desktop";
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string? Monitor { get; set; }
    public string Cpu { get; set; } = string.Empty;
    public int RamGb { get; set; }
    public string? Gpu { get; set; }
    public string Storages { get; set; } = string.Empty;
    public string MacAddress { get; set; } = string.Empty;
    public string? DomainName { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string Accessories { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
