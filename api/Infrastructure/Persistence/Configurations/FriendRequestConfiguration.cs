using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SekaiLib.Domain.Entities;

namespace SekaiLib.Infrastructure.Persistence.Configurations;

public class FriendRequestConfiguration : IEntityTypeConfiguration<FriendRequest>
{
    public void Configure(EntityTypeBuilder<FriendRequest> builder)
    {
        builder.HasKey(fr => fr.Id);

        builder.HasIndex(fr => new { fr.FromUserId, fr.ToUserId, fr.Status })
            .IsUnique(false);

        builder.HasOne(fr => fr.FromUser)
            .WithMany()
            .HasForeignKey(fr => fr.FromUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(fr => fr.ToUser)
            .WithMany()
            .HasForeignKey(fr => fr.ToUserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
