using AutoMapper;
using RSCMP.Application.DTOs;
using RSCMP.Domain.Entities;

namespace RSCMP.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User mappings
        CreateMap<ApplicationUser, UserDto>()
            .ForMember(d => d.Roles, opt => opt.Ignore());

        // Conference mappings
        CreateMap<Conference, ConferenceDto>()
            .ForMember(d => d.ResearchCount, opt => opt.MapFrom(s => s.Researches.Count(r => !r.IsDeleted)));
        CreateMap<ConferenceCreateRequest, Conference>();
        CreateMap<ConferenceUpdateRequest, Conference>();

        // Research mappings
        CreateMap<Research, ResearchDto>()
            .ForMember(d => d.ConferenceName, opt => opt.MapFrom(s => s.Conference.NameEn))
            .ForMember(d => d.ReviewCount, opt => opt.MapFrom(s => s.Reviews.Count(r => !r.IsDeleted)))
            .ForMember(d => d.AverageScore, opt => opt.MapFrom(s => 
                s.Reviews.Where(r => r.Status == Domain.Enums.ReviewStatus.Completed && r.OverallScore.HasValue)
                    .Select(r => r.OverallScore!.Value)
                    .DefaultIfEmpty()
                    .Average()));
        
        CreateMap<Research, ResearchListDto>()
            .ForMember(d => d.ConferenceName, opt => opt.MapFrom(s => s.Conference.NameEn))
            .ForMember(d => d.AuthorCount, opt => opt.MapFrom(s => s.Authors.Count(a => !a.IsDeleted)));
        
        CreateMap<Research, PublicResearchDto>()
            .ForMember(d => d.ConferenceName, opt => opt.MapFrom(s => s.Conference.NameEn))
            .ForMember(d => d.Authors, opt => opt.MapFrom(s => s.Authors.Where(a => !a.IsDeleted).OrderBy(a => a.Order)));
        
        CreateMap<ResearchCreateRequest, Research>();
        CreateMap<ResearchUpdateRequest, Research>();

        // Author mappings
        CreateMap<Author, AuthorDto>();
        CreateMap<Author, PublicAuthorDto>();
        CreateMap<AuthorCreateRequest, Author>();

        // Review mappings
        CreateMap<Review, ReviewDto>()
            .ForMember(d => d.ResearchTitle, opt => opt.MapFrom(s => s.Research.TitleEn));
        CreateMap<ReviewScore, ReviewScoreDto>()
            .ForMember(d => d.CriteriaName, opt => opt.MapFrom(s => s.Criteria.NameEn))
            .ForMember(d => d.MaxScore, opt => opt.MapFrom(s => s.Criteria.MaxScore));
        CreateMap<ReviewCriteria, ReviewCriteriaDto>();
        CreateMap<ReviewCriteriaCreateRequest, ReviewCriteria>();

        // Decision mappings
        CreateMap<ChairmanDecision, DecisionDto>()
            .ForMember(d => d.ResearchTitle, opt => opt.MapFrom(s => s.Research.TitleEn))
            .ForMember(d => d.ChairmanName, opt => opt.MapFrom(s => s.Chairman.FullNameEn));

        // Notification mappings
        CreateMap<Notification, NotificationDto>();

        // Contact mappings
        CreateMap<ContactMessage, ContactMessageDto>();
        CreateMap<ContactCreateRequest, ContactMessage>();

        // File mappings
        CreateMap<ResearchFile, FileUploadResponse>()
            .ForMember(d => d.FileId, opt => opt.MapFrom(s => s.Id));
    }
}
