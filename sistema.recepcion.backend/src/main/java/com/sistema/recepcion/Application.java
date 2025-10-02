package com.sistema.recepcion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    /*
    para comprimir el archivo y poder actualizarse
    se ejecuta el comando de abajo
    o a la derecha en intellij, recomiendo googlear
    el sistema de dependencias es maven
    ./mvnw package -DskipTests

    el archivo comprimido sera un .jar

    ubicado en la carpeta target del proyecto
    subir ese al servidor y ejecutar el comando, se puede cambiar el nombre a voluntad

    pm2 status

    ese mostrara si hay algunos corriendo y pueden ser eliminados con

    pm2 delete "numero que se muestre en el pm2 status ejemplo 0 " -> pm2 delete 0

    y luego

    pm2 start "java -jar sistema.recepcion-1.0.jar" --name backend-recepcion
                            nombre del archivo jar     nombre que se mostrara en el pm2 status

    y listo si corre en local deberia correr ahi

     */
	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

}
