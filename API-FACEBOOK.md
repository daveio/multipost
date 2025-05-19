# Facebook API Integration Guide

## Overview

This document outlines how Multipost can integrate with Facebook's Graph API to enable posting content to Facebook profiles, pages, and groups. Facebook provides a robust API ecosystem that allows applications to interact with various aspects of the platform.

## Graph API Architecture

Facebook's Graph API is a HTTP-based API that forms the primary way to programmatically integrate with Facebook:

- **RESTful Design**: Uses standard HTTP methods (GET, POST, DELETE)
- **JSON Data Format**: All responses are in JSON format
- **Graph Structure**: Represents Facebook's social graph with:
  - **Nodes**: Individual objects (user, page, post, photo)
  - **Edges**: Connections between objects (a page's posts, a user's photos)
  - **Fields**: Data about objects (a user's birthday, a page's name)

## Authentication Methods

Facebook requires OAuth 2.0 authentication for all API access:

1. **User Access Tokens**
   - Short-lived tokens (typically 1-2 hours)
   - Extended tokens (up to 60 days)
   - Used for actions on behalf of a user

2. **Page Access Tokens**
   - Generated from a User Access Token with page management permissions
   - Longer-lived tokens for page management
   - Required for posting as a page

3. **App Access Tokens**
   - Used for app-to-app API calls
   - Not suitable for user-specific actions

## Core API Capabilities

The Facebook Graph API enables Multipost to:

- Create and publish posts to profiles, pages, and groups
- Upload and attach photos and videos
- Schedule posts for future publishing
- Tag other users and pages
- Add location information
- Set privacy settings for posts
- Track post engagement metrics

## Implementation Strategy

For Multipost, we recommend implementing Facebook integration using the following approach:

1. **Authentication Flow**:
   - Implement OAuth 2.0 authorization code flow
   - Request appropriate permissions during authorization
   - Handle token storage and refresh logic

2. **Content Publishing**:
   - Support text posts with `/feed` endpoint
   - Implement photo uploads with `/photos` endpoint
   - Support video content with the Video API

3. **Post Management**:
   - Enable scheduling with `published` and `scheduled_publish_time` parameters
   - Implement draft management if needed

4. **Error Handling**:
   - Implement robust error handling for API responses
   - Handle rate limiting and backoff strategies

## Required Permissions

To publish content, Multipost will need to request these permissions:

- `pages_manage_posts`: Create and edit posts as a page
- `pages_manage_engagement`: Manage comments and reactions to page content
- `pages_read_engagement`: Read content posted on the page
- `publish_to_groups`: Post content to groups (if supported)
- `pages_show_list`: Access the list of pages the user manages
- `publish_video`: Required for video uploads

## Client Libraries

Several libraries can facilitate Facebook API integration:

- **Koala**: Ruby gem specifically for Facebook API integration
- **Omniauth-Facebook**: Ruby gem for OAuth authentication
- **Facebook Business SDK**: Official Ruby SDK for business features

## Rate Limits and Constraints

- **Rate Limiting**: Based on user and app activity, not fixed limits
- **Content Constraints**:
  - Text: No specific character limit, but extremely long posts may be truncated in UI
  - Photos: Up to 30MB per image, various formats supported
  - Videos: Up to 10GB depending on method, various formats
- **Daily Limits**: Some operations have daily usage caps

## Best Practices

1. **Implement Incremental Authorization**: Request only permissions needed at each stage
2. **Cache Access Tokens**: Store tokens securely and minimize refresh operations
3. **Implement Webhook Subscriptions**: For real-time updates on content engagement
4. **Handle API Versioning**: Include API version in all requests
5. **Monitor API Changes**: Facebook regularly updates their API capabilities

## Testing Strategy

Facebook provides several testing tools:

- **Graph API Explorer**: Interactive tool for testing API calls
- **Test Users**: Create test accounts for development and testing
- **Test Apps**: Develop and test without affecting production users

## Development Resources

- [Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [Marketing API Documentation](https://developers.facebook.com/docs/marketing-apis)
- [Facebook Developer Community](https://developers.facebook.com/community/)
- [Facebook for Developers GitHub](https://github.com/facebook)

## Implementation Notes

- The API requires HTTPS for all calls
- API responses include both data and pagination information
- Error responses include detailed error codes and messages
- All user data access requires explicit user consent

## Future Considerations

- Facebook regularly deprecates API versions (typically supported for 2 years)
- Keep track of [Platform Roadmap](https://developers.facebook.com/docs/development/roadmap)
- Plan for changes to permissions and features
- New content formats may become available over time