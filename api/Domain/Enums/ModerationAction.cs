namespace SekaiLib.Domain.Enums;

public enum ModerationAction
{
    BanUser = 0,
    UnbanUser = 1,
    WarnUser = 2,
    RevokeWarning = 3,
    ApproveContent = 4,
    RejectContent = 5,
    DeleteContent = 6,
    LockThread = 7,
    PinThread = 8,
    ReviewReport = 9,
    DismissReport = 10
}
