FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /workspace
COPY gradle gradle
COPY gradlew build.gradle settings.gradle ./
RUN ./gradlew dependencies --no-daemon

COPY src src
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S stagepin && adduser -S stagepin -G stagepin
WORKDIR /app
COPY --from=build /workspace/build/libs/*.jar app.jar

USER stagepin
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

