using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SekaiLib.Domain.Entities;

namespace SekaiLib.Infrastructure.Persistence.Configurations;

public class ReadingListConfiguration : IEntityTypeConfiguration<ReadingList>
{
    public void Configure(EntityTypeBuilder<ReadingList> builder)
    {
        builder.HasKey(rl => rl.Id);

        builder.HasIndex(rl => new { rl.UserId, rl.TitleId })
            .IsUnique();

        builder.HasOne(rl => rl.User)
            .WithMany(u => u.ReadingLists)
            .HasForeignKey(rl => rl.UserId);

        builder.HasOne(rl => rl.Title)
            .WithMany()
            .HasForeignKey(rl => rl.TitleId);
    }
}
