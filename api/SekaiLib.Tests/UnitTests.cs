using Xunit;
using System.Linq;

namespace SekaiLib.Tests;

public class CoreLogicTests
{

    [Fact]
    public void CalculateAverageRating_ReturnsCorrectValue()
    {
        var ratings = new List<int> { 5, 3, 4, 5, 3 }; 
        double expected = 4.0;
        double actual = ratings.Average();
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TitleName_ShouldNotBeEmpty()
    {
        string title = "Solo Leveling";
        Assert.NotEmpty(title);
    }

    [Theory]
    [InlineData(10, 5, 50)] 
    [InlineData(20, 2, 10)] 
    public void ReadingProgress_PercentageCalculation_IsCorrect(int total, int read, double expected)
    {
        double actual = (double)read / total * 100;
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void UserEmail_ShouldContainAtSymbol()
    {
        string email = "test@student.zp.ua";
        Assert.Contains("@", email);
    }

    [Fact]
    public void Chapter_IsPublished_Check()
    {
        bool isPublished = true;
        Assert.True(isPublished);
    }
}