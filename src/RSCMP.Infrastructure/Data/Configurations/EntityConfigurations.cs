using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RSCMP.Domain.Entities;

namespace RSCMP.Infrastructure.Data.Configurations;

public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.Property(u => u.FullNameEn).HasMaxLength(200).IsRequired();
        builder.Property(u => u.FullNameAr).HasMaxLength(200).IsRequired();
        builder.Property(u => u.Institution).HasMaxLength(300);
        builder.Property(u => u.Department).HasMaxLength(200);
        builder.Property(u => u.AcademicTitle).HasMaxLength(100);
        builder.Property(u => u.Bio).HasMaxLength(2000);
        builder.Property(u => u.ProfileImageUrl).HasMaxLength(500);
        builder.Property(u => u.RefreshToken).HasMaxLength(500);

        builder.HasIndex(u => u.Email).IsUnique();
        builder.HasIndex(u => u.IsDeleted);
    }
}

public class ConferenceConfiguration : IEntityTypeConfiguration<Conference>
{
    public void Configure(EntityTypeBuilder<Conference> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.NameEn).HasMaxLength(300).IsRequired();
        builder.Property(c => c.NameAr).HasMaxLength(300).IsRequired();
        builder.Property(c => c.DescriptionEn).HasMaxLength(5000);
        builder.Property(c => c.DescriptionAr).HasMaxLength(5000);
        builder.Property(c => c.LogoUrl).HasMaxLength(500);
        builder.Property(c => c.BannerUrl).HasMaxLength(500);
        builder.Property(c => c.Website).HasMaxLength(300);
        builder.Property(c => c.Location).HasMaxLength(300);
        builder.Property(c => c.ContactEmail).HasMaxLength(200);

        builder.HasIndex(c => c.IsActive);
        builder.HasIndex(c => c.StartDate);
        builder.HasIndex(c => c.SubmissionDeadline);
    }
}

public class ConferenceReviewerConfiguration : IEntityTypeConfiguration<ConferenceReviewer>
{
    public void Configure(EntityTypeBuilder<ConferenceReviewer> builder)
    {
        builder.HasKey(cr => cr.Id);
        
        builder.HasOne(cr => cr.Conference)
            .WithMany(c => c.Reviewers)
            .HasForeignKey(cr => cr.ConferenceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cr => cr.Reviewer)
            .WithMany()
            .HasForeignKey(cr => cr.ReviewerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(cr => new { cr.ConferenceId, cr.ReviewerId }).IsUnique();
    }
}

public class ResearchConfiguration : IEntityTypeConfiguration<Research>
{
    public void Configure(EntityTypeBuilder<Research> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.TitleEn).HasMaxLength(500).IsRequired();
        builder.Property(r => r.TitleAr).HasMaxLength(500).IsRequired();
        builder.Property(r => r.AbstractEn).HasMaxLength(5000).IsRequired();
        builder.Property(r => r.AbstractAr).HasMaxLength(5000).IsRequired();
        builder.Property(r => r.Keywords).HasMaxLength(500);
        builder.Property(r => r.TopicArea).HasMaxLength(200);
        builder.Property(r => r.SubmissionNumber).HasMaxLength(50);

        builder.HasOne(r => r.Conference)
            .WithMany(c => c.Researches)
            .HasForeignKey(r => r.ConferenceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Submitter)
            .WithMany(u => u.SubmittedResearches)
            .HasForeignKey(r => r.SubmitterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => r.ConferenceId);
        builder.HasIndex(r => r.SubmitterId);
        builder.HasIndex(r => r.SubmissionNumber).IsUnique();
        builder.HasIndex(r => r.IsPublic);
    }
}

public class AuthorConfiguration : IEntityTypeConfiguration<Author>
{
    public void Configure(EntityTypeBuilder<Author> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.FullName).HasMaxLength(200).IsRequired();
        builder.Property(a => a.Email).HasMaxLength(200).IsRequired();
        builder.Property(a => a.Institution).HasMaxLength(300);
        builder.Property(a => a.Department).HasMaxLength(200);
        builder.Property(a => a.Country).HasMaxLength(100);
        builder.Property(a => a.OrcidId).HasMaxLength(50);

        builder.HasOne(a => a.Research)
            .WithMany(r => r.Authors)
            .HasForeignKey(a => a.ResearchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(a => a.ResearchId);
        builder.HasIndex(a => a.Email);
    }
}

public class ResearchFileConfiguration : IEntityTypeConfiguration<ResearchFile>
{
    public void Configure(EntityTypeBuilder<ResearchFile> builder)
    {
        builder.HasKey(f => f.Id);
        builder.Property(f => f.FileName).HasMaxLength(300).IsRequired();
        builder.Property(f => f.OriginalFileName).HasMaxLength(300).IsRequired();
        builder.Property(f => f.FilePath).HasMaxLength(500).IsRequired();
        builder.Property(f => f.ContentType).HasMaxLength(100).IsRequired();
        builder.Property(f => f.FileType).HasMaxLength(50).IsRequired();
        builder.Property(f => f.Checksum).HasMaxLength(100);

        builder.HasOne(f => f.Research)
            .WithMany(r => r.Files)
            .HasForeignKey(f => f.ResearchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(f => f.ResearchId);
    }
}

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.CommentsToAuthor).HasMaxLength(5000);
        builder.Property(r => r.CommentsToChairman).HasMaxLength(5000);

        builder.HasOne(r => r.Research)
            .WithMany(res => res.Reviews)
            .HasForeignKey(r => r.ResearchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Reviewer)
            .WithMany(u => u.Reviews)
            .HasForeignKey(r => r.ReviewerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => r.ResearchId);
        builder.HasIndex(r => r.ReviewerId);
        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => new { r.ResearchId, r.ReviewerId }).IsUnique();
    }
}

public class ReviewCriteriaConfiguration : IEntityTypeConfiguration<ReviewCriteria>
{
    public void Configure(EntityTypeBuilder<ReviewCriteria> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.NameEn).HasMaxLength(200).IsRequired();
        builder.Property(c => c.NameAr).HasMaxLength(200).IsRequired();
        builder.Property(c => c.DescriptionEn).HasMaxLength(1000);
        builder.Property(c => c.DescriptionAr).HasMaxLength(1000);

        builder.HasOne(c => c.Conference)
            .WithMany(conf => conf.ReviewCriteria)
            .HasForeignKey(c => c.ConferenceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => c.ConferenceId);
    }
}

public class ReviewScoreConfiguration : IEntityTypeConfiguration<ReviewScore>
{
    public void Configure(EntityTypeBuilder<ReviewScore> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Comment).HasMaxLength(1000);

        builder.HasOne(s => s.Review)
            .WithMany(r => r.Scores)
            .HasForeignKey(s => s.ReviewId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Criteria)
            .WithMany(c => c.Scores)
            .HasForeignKey(s => s.CriteriaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(s => new { s.ReviewId, s.CriteriaId }).IsUnique();
    }
}

public class ChairmanDecisionConfiguration : IEntityTypeConfiguration<ChairmanDecision>
{
    public void Configure(EntityTypeBuilder<ChairmanDecision> builder)
    {
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Justification).HasMaxLength(2000);
        builder.Property(d => d.CommentsToAuthor).HasMaxLength(2000);

        builder.HasOne(d => d.Research)
            .WithOne(r => r.Decision)
            .HasForeignKey<ChairmanDecision>(d => d.ResearchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Chairman)
            .WithMany(u => u.Decisions)
            .HasForeignKey(d => d.ChairmanId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(d => d.ResearchId).IsUnique();
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.HasKey(n => n.Id);
        builder.Property(n => n.TitleEn).HasMaxLength(300).IsRequired();
        builder.Property(n => n.TitleAr).HasMaxLength(300).IsRequired();
        builder.Property(n => n.MessageEn).HasMaxLength(1000).IsRequired();
        builder.Property(n => n.MessageAr).HasMaxLength(1000).IsRequired();
        builder.Property(n => n.Link).HasMaxLength(500);

        builder.HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(n => n.UserId);
        builder.HasIndex(n => n.IsRead);
        builder.HasIndex(n => n.CreatedAt);
    }
}

public class ContactMessageConfiguration : IEntityTypeConfiguration<ContactMessage>
{
    public void Configure(EntityTypeBuilder<ContactMessage> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Name).HasMaxLength(200).IsRequired();
        builder.Property(m => m.Email).HasMaxLength(200).IsRequired();
        builder.Property(m => m.Subject).HasMaxLength(300).IsRequired();
        builder.Property(m => m.Message).HasMaxLength(5000).IsRequired();
        builder.Property(m => m.Response).HasMaxLength(5000);
        builder.Property(m => m.IpAddress).HasMaxLength(50);

        builder.HasOne(m => m.RespondedBy)
            .WithMany()
            .HasForeignKey(m => m.RespondedById)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(m => m.Status);
        builder.HasIndex(m => m.CreatedAt);
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Action).HasMaxLength(100).IsRequired();
        builder.Property(a => a.EntityType).HasMaxLength(100).IsRequired();
        builder.Property(a => a.OldValues).HasMaxLength(5000);
        builder.Property(a => a.NewValues).HasMaxLength(5000);
        builder.Property(a => a.IpAddress).HasMaxLength(50);
        builder.Property(a => a.UserAgent).HasMaxLength(500);
        builder.Property(a => a.AdditionalInfo).HasMaxLength(1000);

        builder.HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(a => a.UserId);
        builder.HasIndex(a => a.Action);
        builder.HasIndex(a => a.EntityType);
        builder.HasIndex(a => a.CreatedAt);
    }
}

public class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSetting>
{
    public void Configure(EntityTypeBuilder<SystemSetting> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Key).HasMaxLength(100).IsRequired();
        builder.Property(s => s.Value).HasMaxLength(2000).IsRequired();
        builder.Property(s => s.DescriptionEn).HasMaxLength(500);
        builder.Property(s => s.DescriptionAr).HasMaxLength(500);
        builder.Property(s => s.Category).HasMaxLength(100).IsRequired();

        builder.HasIndex(s => s.Key).IsUnique();
        builder.HasIndex(s => s.Category);
    }
}
