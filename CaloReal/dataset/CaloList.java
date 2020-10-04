package calorielist;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

public class CaloList {
    
    private static CaloList instance;
    private Map<String, Integer> calomap;
    
    private CaloList(String filename) {
        
        calomap = new HashMap<>();
        
        String line = "";
        String splitBy = ",";
        try {
            BufferedReader br = new BufferedReader(new FileReader(filename));
            while ((line = br.readLine()) != null) {
                String[] data = line.split(splitBy);    // use comma as separator
                if (data.length == 2) {
                    calomap.put(data[0], Integer.parseInt(data[1]));
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    
    public static CaloList getInstance(String filename) {
        instance = Objects.requireNonNullElseGet(instance, () -> new CaloList(filename));
        return instance;
    }
    
    public String getCalories(String food) {
        int cals = (calomap.getOrDefault(food, -1));
        if (cals != -1) {
            return String.format(Locale.CANADA, "%s contains %d calories", food, cals);
        } else {
            return String.format(Locale.CANADA, "Cannot retrieve data for %s", food);
        }
    }
    
    public static void main(String[] args) {
        CaloList caloList = CaloList.getInstance("C:\\Users\\User\\Desktop\\CaloReal\\src\\calorielist\\CalorieList.txt");
        System.out.println(caloList.getCalories("Pancakes"));
        System.out.println(caloList.getCalories("Onion rings"));
        System.out.println(caloList.getCalories("Lasagna"));
        System.out.println(caloList.getCalories("Apple pie"));
        System.out.println(caloList.getCalories("apple pie"));
        System.out.println(caloList.getCalories("Stinky Tofu"));
    }
}

