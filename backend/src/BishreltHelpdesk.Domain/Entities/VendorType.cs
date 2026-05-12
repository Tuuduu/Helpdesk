namespace BishreltHelpdesk.Domain.Entities;

/// <summary>
/// Харилцагч компанийн төрөл (жишээ: "Компьютер засвар", "ERP", "Програм хангамж").
/// VendorContact-тэй many-to-one холбоотой.
/// </summary>
public class VendorType : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<VendorContact> Vendors { get; set; } = new List<VendorContact>();
}
