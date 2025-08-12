# Deployment Guide for AG-URL Shortener Frontend

## Netlify Deployment Instructions

### Prerequisites

- A GitHub repository with your frontend code
- A Netlify account (free tier is sufficient)
- Backend API already deployed on Render at `https://urlshortenerapi-xrqh.onrender.com`

### Deployment Steps

1. **Push your code to GitHub**
   - Ensure all changes are committed and pushed to your repository

2. **Sign in to Netlify**
   - Go to [Netlify](https://app.netlify.com/) and sign in

3. **Create a new site**
   - Click "New site from Git"
   - Select your Git provider (GitHub)
   - Authorize Netlify to access your repositories
   - Select your repository

4. **Configure build settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click "Show advanced" to add environment variables

5. **Add environment variables**
   - Add `VITE_API_URL` with value `https://urlshortenerapi-xrqh.onrender.com`

6. **Deploy the site**
   - Click "Deploy site"
   - Wait for the build and deployment to complete

7. **Configure custom domain (optional)**
   - In the Netlify dashboard, go to "Domain settings"
   - Click "Add custom domain"
   - Follow the instructions to set up your domain

## Troubleshooting

### CORS Issues
- If you encounter CORS errors, check that the backend CORS configuration allows requests from your Netlify domain
- The current backend configuration allows all origins (`*`), so this should not be an issue

### Socket.io Connection Issues
- If real-time updates are not working, check the browser console for connection errors
- Ensure the environment variable `VITE_API_URL` is correctly set

### API Connection Issues
- If the frontend cannot connect to the backend API, verify that the Render service is running
- Check that all API endpoint URLs in the code are using the environment variable

## Monitoring and Maintenance

- Use Netlify's built-in analytics to monitor site traffic
- Set up notifications for deploy failures
- Regularly check the backend logs on Render for any issues