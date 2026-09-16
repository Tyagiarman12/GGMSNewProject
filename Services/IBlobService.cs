using System.IO;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Services
{
    public interface IBlobService
    {
        Task<string> UploadBlobAsync(Stream stream, string fileName, string contentType);
    }
}
