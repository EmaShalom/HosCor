# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S hoscor && adduser -S hoscor -G hoscor
COPY --from=build /app/target/*.jar app.jar
USER hoscor
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
