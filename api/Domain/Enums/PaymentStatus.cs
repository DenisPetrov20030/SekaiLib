namespace SekaiLib.Domain.Enums;

public enum PaymentStatus
{
    Pending = 0,
    Success = 1,
    Failure = 2,
    Reversed = 3,   // повернення коштів
    Sandbox = 4     // успішна sandbox-оплата
}
