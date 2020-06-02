import java.io.File;
import java.util.List;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.util.ArrayList;

class CardIndex {

  public static void main(final String[] args) {

    final List<File> files = new ArrayList<File>();
    getFiles(args[0] + "\\images", files);

    startJSON();

    int count = 0;

    for (File file : files) {

      final String dir = file.getParent();

      final String path = dir.compareTo(args[0]) != 0 ? dir.substring(args[0].length() + 1) : "";
      final String filename = file.getPath().substring(dir.length() + 1);

      if (filename.indexOf(".JPG") == -1) {
        continue;
      }

      // // Skip duplicate cards in same set
      // if (filename.indexOf("-") != -1) {
      //   // System.out.println(">>skipping " + filename);
      //   continue;
      // }

      final String filePath = path + "\\" + filename;
      final String fileUrl = filePath.replace('\\', '/');
      final BufferedImage image = getImage(file.getAbsolutePath());

      if(image != null) {
        printJSON(fileUrl, image.getHeight(), image.getWidth(), count);
        count++;
      }

    }

    endJSON();

  }

  private static void startJSON() {
    System.out.println("{\"cards\":[");
  }

  private static void endJSON() {
    System.out.println("]}");
  }

  private static void printJSON(final String url, final int height, int width, final int count) {
    if (count > 0) {
      System.out.println(",");
    }

    System.out.print("{");
    System.out.print("\"id\":\"" + (count + 1) + "\",");
    System.out.print("\"url\":\"" + url + "\",");
    System.out.print("\"height\":" + height + ",");
    System.out.print("\"width\":" + width + "");
    System.out.print("}");

  }

  private static BufferedImage getImage(final String url) {
    try {
      return ImageIO.read(new File(url));
    } catch (final Exception e) {
      System.out.println("Error:" + url + " :: " + e.getMessage());
    }
    return null;
  }

  private static void getFiles(final String dir, final List<File> files) {
    final File folder = new File(dir);
    final File[] listOfFiles = folder.listFiles();

    for (int i = 0; i < listOfFiles.length; i++) {
      if (listOfFiles[i].isFile()) {
        files.add(listOfFiles[i]);
      } else if (listOfFiles[i].isDirectory()) {
        getFiles(listOfFiles[i].getPath(), files);
      }
    }
  }

}
