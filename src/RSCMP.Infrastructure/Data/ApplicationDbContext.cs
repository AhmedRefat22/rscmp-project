using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RSCMP.Domain.Entities;

namespace RSCMP.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Conference> Conferences => Set<Conference>();
    public DbSet<ConferenceReviewer> ConferenceReviewers => Set<ConferenceReviewer>();
    public DbSet<Research> Researches => Set<Research>();
    public DbSet<Author> Authors => Set<Author>();
    public DbSet<ResearchFile> ResearchFiles => Set<ResearchFile>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ReviewCriteria> ReviewCriteria => Set<ReviewCriteria>();
    public DbSet<ReviewScore> ReviewScores => Set<ReviewScore>();
    public DbSet<ChairmanDecision> ChairmanDecisions => Set<ChairmanDecision>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Apply configurations
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // Global query filter for soft delete
        builder.Entity<Conference>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Research>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Author>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<ResearchFile>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Review>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<ReviewCriteria>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<ReviewScore>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<ChairmanDecision>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Notification>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<ContactMessage>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<AuditLog>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<SystemSetting>().HasQueryFilter(e => !e.IsDeleted);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is Domain.Common.BaseEntity entity)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entity.CreatedAt = DateTime.UtcNow;
                        break;
                    case EntityState.Modified:
                        entity.UpdatedAt = DateTime.UtcNow;
                        break;
                }
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
