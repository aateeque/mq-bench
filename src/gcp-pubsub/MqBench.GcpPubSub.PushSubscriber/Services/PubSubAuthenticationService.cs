using Google.Apis.Auth;

namespace MqBench.GcpPubSub.PushSubscriber.Services;

public class PubSubAuthenticationService
{
    private readonly ILogger<PubSubAuthenticationService> _logger;
    private readonly string? _expectedAudience;
    private readonly string? _expectedServiceAccount;
    private readonly bool _authEnabled;

    public PubSubAuthenticationService(
        ILogger<PubSubAuthenticationService> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _expectedAudience = configuration["PubSub:ExpectedAudience"];
        _expectedServiceAccount = configuration["PubSub:ExpectedServiceAccount"];
        _authEnabled = !string.IsNullOrEmpty(_expectedAudience);

        if (!_authEnabled)
        {
            _logger.LogWarning(
                "Pub/Sub authentication is DISABLED. Set PubSub:ExpectedAudience to enable.");
        }
    }

    public async Task<bool> ValidateTokenAsync(string? authorizationHeader)
    {
        if (!_authEnabled)
        {
            return true;
        }

        if (string.IsNullOrEmpty(authorizationHeader) ||
            !authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Missing or invalid Authorization header");
            return false;
        }

        var token = authorizationHeader["Bearer ".Length..];

        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(token,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { _expectedAudience }
                });

            // Optionally verify the service account
            if (!string.IsNullOrEmpty(_expectedServiceAccount) &&
                payload.Email != _expectedServiceAccount)
            {
                _logger.LogWarning(
                    "Token email {Email} does not match expected {Expected}",
                    payload.Email, _expectedServiceAccount);
                return false;
            }

            return true;
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Invalid Pub/Sub JWT token");
            return false;
        }
    }
}
