namespace BishreltHelpdesk.Domain.Entities;

public class CallTypeConfig : BaseEntity
{
    /// <summary>Тикетэд хадгалагдах үл өөрчлөгдөх код (жнь: "PhoneCall")</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>UI дээр харагдах нэр (жнь: "Утасны дуудлага")</summary>
    public string Label { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; } = 0;

    /// <summary>Энэ дуудлагын төрлөөр үүссэн тикетийн анхдагч зэрэглэл</summary>
    public string DefaultPriority { get; set; } = "Medium";
}
