# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/RSCMP.API/RSCMP.API.csproj", "src/RSCMP.API/"]
COPY ["src/RSCMP.Application/RSCMP.Application.csproj", "src/RSCMP.Application/"]
COPY ["src/RSCMP.Domain/RSCMP.Domain.csproj", "src/RSCMP.Domain/"]
COPY ["src/RSCMP.Infrastructure/RSCMP.Infrastructure.csproj", "src/RSCMP.Infrastructure/"]
RUN dotnet restore "src/RSCMP.API/RSCMP.API.csproj"
COPY . .
WORKDIR "/src/src/RSCMP.API"
RUN dotnet build "RSCMP.API.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "RSCMP.API.csproj" -c Release -o /app/publish

# Final Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "RSCMP.API.dll"]
