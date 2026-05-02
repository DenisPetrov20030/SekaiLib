# Етап збірки
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Копіюємо файл проекту та рішення прямо в корінь WORKDIR
COPY ["SekaiLib.sln", "./"]
COPY ["SekaiLib.csproj", "./"]

# 2. Відновлюємо залежності
RUN dotnet restore "SekaiLib.csproj"

# 3. Копіюємо всі інші файли (папки Presentation, Migrations і т.д.)
COPY . .

# 4. Збираємо проект
RUN dotnet publish "SekaiLib.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Етап запуску
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

# Налаштування порту 
EXPOSE 8080
ENTRYPOINT ["dotnet", "SekaiLib.dll"]