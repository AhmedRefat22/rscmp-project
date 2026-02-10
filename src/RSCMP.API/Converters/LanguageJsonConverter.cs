using System.Text.Json;
using System.Text.Json.Serialization;
using RSCMP.Domain.Enums;

namespace RSCMP.API.Converters;

public class LanguageJsonConverter : JsonConverter<Language>
{
    public override Language Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        string? value = reader.GetString();
        
        if (string.IsNullOrEmpty(value))
        {
            return Language.English; // Default
        }

        return value.ToLower() switch
        {
            "ar" or "arabic" => Language.Arabic,
            "en" or "english" => Language.English,
            _ => Language.English // Default fallback or throw exception? Better fallback for now to avoid errors
        };
    }

    public override void Write(Utf8JsonWriter writer, Language value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value == Language.Arabic ? "ar" : "en");
    }
}
