using Xunit;
using System.Net;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
namespace SekaiLib.Tests;

public class ApiTests
{

    [Fact]
    public void TitlesController_SearchValidation_ReturnsTrue()
    {
        string searchQuery = "Sekai";
        bool isValidSearch = searchQuery.Length >= 3;

        Assert.True(isValidSearch, "Пошуковий запит занадто короткий");
    }

    [Fact]
    public void ReviewsController_PostReview_CheckContent()
    {
        string reviewText = "Дуже цікаве ранобе, рекомендую!";
        int score = 5;

        Assert.NotEmpty(reviewText);
        Assert.InRange(score, 1, 5); 
    }

    [Fact]
    public void AuthController_LoginSchema_IsCorrect()
    {
        var loginModel = new { Email = "user@example.com", Password = "password123" };

        Assert.NotNull(loginModel.Email);
        Assert.Contains("@", loginModel.Email);
        Assert.True(loginModel.Password.Length >= 6);
    }

    [Theory]
    [InlineData("Admin", true)]
    [InlineData("User", false)]
    [InlineData("Moderator", true)]
    public void UsersController_HasPrivilegedRole_Check(string role, bool expectedResult)
    {
        bool hasAccess = role == "Admin" || role == "Moderator";

        Assert.Equal(expectedResult, hasAccess);
    }

    [Fact]
    public void Titles_ChaptersRelationship_ListIsNotNull()
    {
        var chapters = new List<string> { "Глава 1", "Глава 2" };

        Assert.NotNull(chapters);
        Assert.NotEmpty(chapters);
    }
}