using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SekaiLib.Domain.Entities;

namespace SekaiLib.Infrastructure.Persistence.Configurations;

public class ReviewReactionConfiguration : IEntityTypeConfiguration<ReviewReaction>
{
    public void Configure(EntityTypeBuilder<ReviewReaction> builder)
    {
        builder.HasKey(r => r.Id);

        builder.HasOne(r => r.User)
            .WithMany(u => u.ReviewReactions)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Review)
            .WithMany(r => r.Reactions)
            .HasForeignKey(r => r.ReviewId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => new { r.UserId, r.ReviewId }).IsUnique();
    }
}
