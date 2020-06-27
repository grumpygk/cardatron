import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

import java.util.ArrayList;

class MakeKeywordFile {

  public static void main(final String[] args) {

    String outputFileName = "keywords.json";
    String outputFilePath = args[0] + "\\" + outputFileName;

    if(!isExistingFile(args[0])) {
      System.out.println("Path: " + args[0] + " does not exist");
      System.exit(-3);
    }

    if(isExistingFile(outputFilePath)) {
      System.out.println(outputFileName + " already exists");
      System.exit(-1);
    }

    final List<File> files = new ArrayList<File>();
    getFiles(args[0], files);

    int count = 0;

    PrintWriter printWriter = null;

    for (File file : files) {

      final String dir = file.getParent();

      final String filename = file.getPath().substring(dir.length() + 1);

      if(!isImageFile(filename)){
        continue;
      }

      if(count==0) {
        try {
          FileWriter fileWriter = new FileWriter(outputFilePath);
          printWriter = new PrintWriter(fileWriter);
          startKeywords(printWriter);
        } catch (IOException e) {
          System.out.println("Unable to open file for write:" + outputFilePath);
          System.exit(-2);
        }
      }

      printKeywords(printWriter, filename, count);
      count++;
    }

    endKeywords(printWriter);

    printWriter.close();

  }

  private static boolean isExistingFile(String filePath) {
    File file = new File(filePath);
    return (file.exists());
  }

  private static boolean isImageFile(String filename) {
    String[] parts = filename.split("[.]");
    String ext = parts[parts.length-1].toLowerCase();
    
    return (ext.equals("jpg") || ext.equals("png")); 

  }
  private static void startKeywords(PrintWriter printWriter) {
    printWriter.println("[");
  }

  private static void endKeywords(PrintWriter printWriter) {
    printWriter.println("\n]");
  }
 
  private static void printKeywords(PrintWriter printWriter, final String file, final int count) {
    if (count > 0) {
      printWriter.println(",");
    }

    printWriter.println("\t{");
    printWriter.println("\t\t\"keywords\":[],");
    printWriter.println("\t\t\"images\":[\"" + file + "\"]");
    printWriter.print("\t}");
  }

  private static void getFiles(final String dir, final List<File> files) {
    final File folder = new File(dir);
    final File[] listOfFiles = folder.listFiles();

    for (int i = 0; i < listOfFiles.length; i++) {
      if (listOfFiles[i].isFile()) {
        files.add(listOfFiles[i]);
      }
      //  else if (listOfFiles[i].isDirectory()) {
      //   getFiles(listOfFiles[i].getPath(), files);
      // }
    }
  }

}
