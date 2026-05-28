import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import confusion_matrix
import joblib as jb

pd.set_option("display.max_columns", None)

# read in data
dataset = pd.read_csv("/Users/hassaantariq/Documents/computer_science_work/tmls_hackathon/food_robotics_machinery_data.csv")

# eda
print(dataset.shape)
print(dataset.isna().sum())
print(dataset.dtypes)
print(dataset.describe())
print(dataset.corr(numeric_only=True))
print(dataset.head())

# preprocessing & feature engineering
X = dataset[["Year_Installed", "Operating_Hours", "Motor_Temp_C", "Ambient_Temp_C", "Vibration_mm_s", "RPM", "Power_Draw_kW", 
             "Conveyor_Speed_m_min", "Pressure_PSI", "Hydraulic_Fluid_Temp_C", "Noise_Level_dB", "Defect_Count", "Defect_Rate_Pct", 
             "Days_Since_Maintenance", "Sensor_Status"]]
Y = dataset[["Severity_Level"]]

X_modified = pd.get_dummies(X, columns=["Sensor_Status"], drop_first=True)

# split the dataset
x_train, x_test, y_train, y_test = train_test_split(X_modified, Y, random_state = 42)
x_train, x_valid, y_train, y_valid = train_test_split(x_train, y_train, random_state = 42)

# train model
model = RandomForestClassifier(random_state = 42)
model.fit(x_train, y_train.values.ravel())
y_pred_valid = model.predict(x_valid)

# compute metrics
print(confusion_matrix(y_valid, y_pred_valid))

# test model
y_pred_test = model.predict(x_test)

# compute metrics
print(confusion_matrix(y_test, y_pred_test))

# save model
jb.dump(model, "robot_model.pkl")