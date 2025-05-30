# Use Node.js LTS
FROM node:lts

WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install


# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Do not run migrations here; handled at runtime in docker-compose

EXPOSE 3001

# Use development mode for hot reloading
CMD ["npm", "run", "start:dev"]
