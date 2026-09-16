using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Threading.Tasks;

namespace GGMSNEWPROJECT.Services
{
    public class BlobService : IBlobService
    {
        private readonly string? _connectionString;
        private readonly string? _containerName;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<BlobService> _logger;

        public BlobService(IConfiguration configuration, IWebHostEnvironment env, ILogger<BlobService> logger)
        {
            _connectionString = configuration["AzureStorage:ConnectionString"];
            _containerName = configuration["AzureStorage:ContainerName"];
            _env = env;
            _logger = logger;
        }

        public async Task<string> UploadBlobAsync(Stream stream, string fileName, string contentType)
        {
            // Verify if the connection string is a placeholder or empty
            bool useLocalFallback = string.IsNullOrEmpty(_connectionString) || 
                                    _connectionString.Contains("YOUR-ACCOUNT-KEY-HERE") ||
                                    string.IsNullOrEmpty(_containerName);

            if (useLocalFallback)
            {
                _logger.LogInformation("Using local filesystem fallback for file upload.");
                
                string uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                string uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
                string filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await stream.CopyToAsync(fileStream);
                }

                return $"/uploads/{uniqueFileName}";
            }

            try
            {
                _logger.LogInformation("Uploading file to Azure Blob Storage.");
                var blobServiceClient = new BlobServiceClient(_connectionString);
                var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);
                
                // Ensure the container exists
                await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

                string uniqueBlobName = $"{Guid.NewGuid()}_{fileName}";
                var blobClient = containerClient.GetBlobClient(uniqueBlobName);

                var blobHttpHeaders = new BlobHttpHeaders
                {
                    ContentType = contentType
                };

                await blobClient.UploadAsync(stream, new BlobUploadOptions { HttpHeaders = blobHttpHeaders });

                return blobClient.Uri.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload file to Azure Blob Storage. Falling back to local storage.");
                
                // Fallback to local storage if Azure upload fails
                string uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                string uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
                string filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await stream.CopyToAsync(fileStream);
                }

                return $"/uploads/{uniqueFileName}";
            }
        }
    }
}
