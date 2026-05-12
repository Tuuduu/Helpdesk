namespace BishreltHelpdesk.Domain.Entities;

/// <summary>
/// МТ-ийн харилцагч компанийн утасны лавлах бүртгэл.
/// Жишээ нь: тоног төхөөрөмж нийлүүлэгч, програм хангамжийн дилер, засвар үйлчилгээ.
/// </summary>
public class VendorContact : BaseEntity
{
    public Guid VendorTypeId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? AccountManager { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public bool ShowOnLoginPage { get; set; } = false;

    public VendorType VendorType { get; set; } = null!;
}
