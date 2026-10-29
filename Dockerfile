# --- Compilación ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

# --- Ejecución ---
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# El plan gratuito de Render tiene 512 MB de RAM: limitamos el heap de Java
ENV JAVA_TOOL_OPTIONS="-Xmx300m -XX:+UseSerialGC"
ENTRYPOINT ["java", "-jar", "app.jar"]
