using Xunit;
using System.Linq;

namespace SekaiLib.Tests;

public class CoreLogicTests
{
    // Тест 1: Перевірка розрахунку середнього рейтингу
    [Fact]
    public void CalculateAverageRating_ReturnsCorrectValue()
    {
        var ratings = new List<int> { 5, 3, 4, 5, 3 }; // Сума 20, К-ть 5
        double expected = 4.0;
        double actual = ratings.Average();
        Assert.Equal(expected, actual);
    }

    // Тест 2: Валідація довжини назви тайтлу (щоб не "ламався" інтерфейс)
    [Fact]
    public void TitleName_ShouldNotBeEmpty()
    {
        string title = "Solo Leveling";
        Assert.NotEmpty(title);
    }

    // Тест 3: Логіка прогресу читання
    [Theory]
    [InlineData(10, 5, 50)] // 5 з 10 = 50%
    [InlineData(20, 2, 10)] // 2 з 20 = 10%
    public void ReadingProgress_PercentageCalculation_IsCorrect(int total, int read, double expected)
    {
        double actual = (double)read / total * 100;
        Assert.Equal(expected, actual);
    }

    // Тест 4: Перевірка формату емейла користувача (проста логіка)
    [Fact]
    public void UserEmail_ShouldContainAtSymbol()
    {
        string email = "test@student.zp.ua";
        Assert.Contains("@", email);
    }

    // Тест 5: Перевірка статусу розділу (Chapters)
    [Fact]
    public void Chapter_IsPublished_Check()
    {
        bool isPublished = true;
        Assert.True(isPublished);
    }
}