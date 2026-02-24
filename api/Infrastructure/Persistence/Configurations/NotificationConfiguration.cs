using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SekaiLib.Domain.Entities;

namespace SekaiLib.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.HasKey(n => n.Id);

        builder.Property(n => n.TitleText)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(n => n.Message)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(n => n.Link)
            .HasMaxLength(500);

        builder.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });

        builder.HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(n => n.ActorUser)
            .WithMany()
            .HasForeignKey(n => n.ActorUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(n => n.Title)
            .WithMany()
            .HasForeignKey(n => n.TitleId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(n => n.Chapter)
            .WithMany()
            .HasForeignKey(n => n.ChapterId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
