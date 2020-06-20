import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.ResourceHandler;

public class EmbeddedJettyFileServer {
    public static void main(String... args) throws Exception {
        int port = 8080;
        String path = "./public";
        boolean dirAllowed = false;

        if(args.length > 0) {
            if(args[0].contains("?") || args[0].toLowerCase().contains("help")) {
                System.out.println("Override parameters: {port} {path} {dir allowed}");
                System.out.println("Default values are : " + port + " " + path + " " + dirAllowed);
                System.exit(0);
            }

            port = Integer.parseInt(args[0]);
        }

        if(args.length > 1) {
            path = args[1];
        }

        if(args.length > 2) {
            dirAllowed = args[2].toLowerCase().equals("true");
        }

        System.out.println("Starting Server on port " + port + " for path " + path + ", directory listing is " + (dirAllowed ? "enabled" : "disabled"));
        Server server = new Server(port);

        ResourceHandler resourceHandler = new ResourceHandler();
        resourceHandler.setDirAllowed(dirAllowed);
        resourceHandler.setResourceBase(path);
        server.setHandler(resourceHandler);

        server.start();
        server.join();
    }
}
