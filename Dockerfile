# Copy both package.json and package-lock.json
COPY package*.json ./

# Run the clean install
RUN npm ci
