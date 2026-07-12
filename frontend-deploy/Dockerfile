FROM nginx:alpine
# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy the built React app
COPY dist /usr/share/nginx/html
# Expose port 8080 (Cloud Run default)
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
