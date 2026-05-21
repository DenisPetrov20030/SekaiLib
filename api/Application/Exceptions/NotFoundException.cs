namespace SekaiLib.Application.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string entityName, Guid id)
        : base($"{entityName} з ID {id} не знайдено") { }

    public NotFoundException(string message)
        : base(message) { }
}
