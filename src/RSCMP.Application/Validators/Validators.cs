using FluentValidation;
using RSCMP.Application.DTOs;

namespace RSCMP.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required | البريد الإلكتروني مطلوب")
            .EmailAddress().WithMessage("Invalid email format | صيغة البريد الإلكتروني غير صحيحة");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required | كلمة المرور مطلوبة");
    }
}

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required | البريد الإلكتروني مطلوب")
            .EmailAddress().WithMessage("Invalid email format | صيغة البريد الإلكتروني غير صحيحة");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required | كلمة المرور مطلوبة")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters | كلمة المرور يجب أن تكون 8 أحرف على الأقل")
            .Matches("[A-Z]").WithMessage("Password must contain uppercase letter | كلمة المرور يجب أن تحتوي على حرف كبير")
            .Matches("[a-z]").WithMessage("Password must contain lowercase letter | كلمة المرور يجب أن تحتوي على حرف صغير")
            .Matches("[0-9]").WithMessage("Password must contain digit | كلمة المرور يجب أن تحتوي على رقم")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain special character | كلمة المرور يجب أن تحتوي على رمز خاص");

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password).WithMessage("Passwords do not match | كلمات المرور غير متطابقة");

        RuleFor(x => x.FullNameEn)
            .NotEmpty().WithMessage("English name is required | الاسم بالإنجليزية مطلوب")
            .MaximumLength(200).WithMessage("Name is too long | الاسم طويل جداً");

        RuleFor(x => x.FullNameAr)
            .NotEmpty().WithMessage("Arabic name is required | الاسم بالعربية مطلوب")
            .MaximumLength(200).WithMessage("Name is too long | الاسم طويل جداً");
    }
}

public class ConferenceCreateRequestValidator : AbstractValidator<ConferenceCreateRequest>
{
    public ConferenceCreateRequestValidator()
    {
        RuleFor(x => x.NameEn)
            .NotEmpty().WithMessage("English name is required | الاسم بالإنجليزية مطلوب")
            .MaximumLength(300).WithMessage("Name is too long | الاسم طويل جداً");

        RuleFor(x => x.NameAr)
            .NotEmpty().WithMessage("Arabic name is required | الاسم بالعربية مطلوب")
            .MaximumLength(300).WithMessage("Name is too long | الاسم طويل جداً");

        RuleFor(x => x.StartDate)
            .GreaterThan(DateTime.UtcNow.AddDays(-1)).WithMessage("Start date must be in the future | تاريخ البداية يجب أن يكون في المستقبل");

        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate).WithMessage("End date must be after start date | تاريخ النهاية يجب أن يكون بعد تاريخ البداية");

        RuleFor(x => x.SubmissionDeadline)
            .LessThan(x => x.StartDate).WithMessage("Submission deadline must be before conference start | آخر موعد للتقديم يجب أن يكون قبل بداية المؤتمر");
    }
}

public class ResearchCreateRequestValidator : AbstractValidator<ResearchCreateRequest>
{
    public ResearchCreateRequestValidator()
    {
        RuleFor(x => x.ConferenceId)
            .NotEmpty().WithMessage("Conference is required | المؤتمر مطلوب");

        RuleFor(x => x.TitleEn)
            .NotEmpty().WithMessage("English title is required | العنوان بالإنجليزية مطلوب")
            .MaximumLength(500).WithMessage("Title is too long | العنوان طويل جداً");

        RuleFor(x => x.TitleAr)
            .NotEmpty().WithMessage("Arabic title is required | العنوان بالعربية مطلوب")
            .MaximumLength(500).WithMessage("Title is too long | العنوان طويل جداً");

        RuleFor(x => x.AbstractEn)
            .NotEmpty().WithMessage("English abstract is required | الملخص بالإنجليزية مطلوب")
            .MaximumLength(5000).WithMessage("Abstract is too long | الملخص طويل جداً");

        RuleFor(x => x.AbstractAr)
            .NotEmpty().WithMessage("Arabic abstract is required | الملخص بالعربية مطلوب")
            .MaximumLength(5000).WithMessage("Abstract is too long | الملخص طويل جداً");

        RuleFor(x => x.Authors)
            .NotEmpty().WithMessage("At least one author is required | مطلوب مؤلف واحد على الأقل");

        RuleForEach(x => x.Authors).SetValidator(new AuthorCreateRequestValidator());
    }
}

public class AuthorCreateRequestValidator : AbstractValidator<AuthorCreateRequest>
{
    public AuthorCreateRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Author name is required | اسم المؤلف مطلوب")
            .MaximumLength(200).WithMessage("Name is too long | الاسم طويل جداً");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Author email is required | البريد الإلكتروني للمؤلف مطلوب")
            .EmailAddress().WithMessage("Invalid email format | صيغة البريد الإلكتروني غير صحيحة");
    }
}

public class ReviewSubmitRequestValidator : AbstractValidator<ReviewSubmitRequest>
{
    public ReviewSubmitRequestValidator()
    {
        RuleFor(x => x.Recommendation)
            .IsInEnum().WithMessage("Invalid recommendation | التوصية غير صحيحة");

        RuleFor(x => x.Scores)
            .NotEmpty().WithMessage("Scores are required | الدرجات مطلوبة");
    }
}

public class ContactCreateRequestValidator : AbstractValidator<ContactCreateRequest>
{
    public ContactCreateRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required | الاسم مطلوب")
            .MaximumLength(200).WithMessage("Name is too long | الاسم طويل جداً");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required | البريد الإلكتروني مطلوب")
            .EmailAddress().WithMessage("Invalid email format | صيغة البريد الإلكتروني غير صحيحة");

        RuleFor(x => x.Subject)
            .NotEmpty().WithMessage("Subject is required | الموضوع مطلوب")
            .MaximumLength(300).WithMessage("Subject is too long | الموضوع طويل جداً");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Message is required | الرسالة مطلوبة")
            .MaximumLength(5000).WithMessage("Message is too long | الرسالة طويلة جداً");
    }
}

public class DecisionCreateRequestValidator : AbstractValidator<DecisionCreateRequest>
{
    public DecisionCreateRequestValidator()
    {
        RuleFor(x => x.ResearchId)
            .NotEmpty().WithMessage("Research is required | البحث مطلوب");

        RuleFor(x => x.Decision)
            .IsInEnum().WithMessage("Invalid decision | القرار غير صحيح");

        RuleFor(x => x.Justification)
            .MaximumLength(2000).WithMessage("Justification is too long | التبرير طويل جداً");
    }
}
