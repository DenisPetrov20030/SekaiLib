using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SekaiLib.Domain.Entities;

namespace SekaiLib.Infrastructure.Persistence.Configurations;

public class ReadingProgressConfiguration : IEntityTypeConfiguration<ReadingProgress>
{
    public void Configure(EntityTypeBuilder<ReadingProgress> builder)
    {
        builder.HasKey(rp => rp.Id);

        builder.HasIndex(rp => new { rp.UserId, rp.ChapterId })
            .IsUnique();

        builder.HasOne(rp => rp.User)
            .WithMany(u => u.ReadingProgresses)
            .HasForeignKey(rp => rp.UserId);

        builder.HasOne(rp => rp.Chapter)
            .WithMany()
            .HasForeignKey(rp => rp.ChapterId);
    }
}
