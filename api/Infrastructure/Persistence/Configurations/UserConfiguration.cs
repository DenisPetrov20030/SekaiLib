using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SekaiLib.Domain.Entities;

namespace SekaiLib.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(u => u.Username)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.Gender)
            .IsRequired();

        builder.Property(u => u.AboutMe)
            .HasMaxLength(1000);

        builder.Property(u => u.NotifyListStatuses)
            .HasDefaultValue("0")
            .HasMaxLength(1000);

        builder.Property(u => u.NotifyUserListIds)
            .HasDefaultValue("[]")
            .HasMaxLength(5000);

        builder.Property(u => u.NotifyTitleCompleted)
            .HasDefaultValue(false);

        builder.Property(u => u.NotifyFriendRequests)
            .HasDefaultValue(false);

        builder.Property(u => u.PasswordHash)
            .IsRequired(false);

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.HasIndex(u => u.Username)
            .IsUnique();

        builder.HasMany(u => u.ReadingLists)
            .WithOne(rl => rl.User)
            .HasForeignKey(rl => rl.UserId);

        builder.HasMany(u => u.ReadingProgresses)
            .WithOne(rp => rp.User)
            .HasForeignKey(rp => rp.UserId);

        builder.HasMany(u => u.RefreshTokens)
            .WithOne(rt => rt.User)
            .HasForeignKey(rt => rt.UserId);

        builder.HasMany(u => u.ExternalLogins)
            .WithOne(ul => ul.User)
            .HasForeignKey(ul => ul.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
