# Used by Render/Railway to build and run the Java API.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/kfc-pos.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
