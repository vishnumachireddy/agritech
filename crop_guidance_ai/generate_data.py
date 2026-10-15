import os
import pandas as pd
import numpy as np
import random

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")

if not os.path.exists(DATASETS_DIR):
    os.makedirs(DATASETS_DIR)

# 1. crop_recommendation_dataset.csv (100 rows)
# N, P, K, temperature, humidity, ph, rainfall, label
crops = ["Rice", "Maize", "Chickpea", "Kidneybeans", "Pigeonpeas", "Mothbeans", "Mungbean", "Blackgram", "Lentil", "Pomegranate", "Banana", "Mango", "Grapes", "Watermelon", "Muskmelon", "Apple", "Orange", "Papaya", "Coconut", "Cotton", "Jute", "Coffee"]
data_crop_rec = {
    "N": np.random.randint(0, 140, 100),
    "P": np.random.randint(5, 145, 100),
    "K": np.random.randint(5, 205, 100),
    "temperature": np.random.uniform(8.0, 43.0, 100).round(2),
    "humidity": np.random.uniform(14.0, 100.0, 100).round(2),
    "ph": np.random.uniform(3.5, 9.9, 100).round(2),
    "rainfall": np.random.uniform(20.0, 298.0, 100).round(2),
    "label": np.random.choice(crops, 100)
}
pd.DataFrame(data_crop_rec).to_csv(os.path.join(DATASETS_DIR, "crop_recommendation_dataset.csv"), index=False)

# 2. soil_npk_dataset.csv (100 rows)
# region, soil_type, rainfall, N, P, K
regions = ["North", "South", "East", "West", "Central"]
soil_types = ["Loamy", "Clay", "Sandy", "Peaty", "Saline"]
data_soil = {
    "region": np.random.choice(regions, 100),
    "soil_type": np.random.choice(soil_types, 100),
    "rainfall": np.random.uniform(20.0, 250.0, 100).round(2),
    "N": np.random.uniform(10, 120, 100).round(2),
    "P": np.random.uniform(10, 80, 100).round(2),
    "K": np.random.uniform(10, 100, 100).round(2),
}
pd.DataFrame(data_soil).to_csv(os.path.join(DATASETS_DIR, "soil_npk_dataset.csv"), index=False)

# 3. ph_dataset.csv (100 rows)
# region, soil_type, rainfall, ph
data_ph = {
    "region": np.random.choice(regions, 100),
    "soil_type": np.random.choice(soil_types, 100),
    "rainfall": np.random.uniform(20.0, 250.0, 100).round(2),
    "ph": np.random.uniform(4.5, 8.5, 100).round(2),
}
pd.DataFrame(data_ph).to_csv(os.path.join(DATASETS_DIR, "ph_dataset.csv"), index=False)

# 4. crop_profit_dataset.csv (100 rows)
# crop_name, land_size, cost, revenue, net_profit
data_profit = {
    "crop_name": np.random.choice(crops, 100),
    "land_size": np.random.uniform(1.0, 50.0, 100).round(1),
}
df_profit = pd.DataFrame(data_profit)
df_profit['cost'] = (df_profit['land_size'] * np.random.uniform(15000, 30000, 100)).round(2)
df_profit['revenue'] = (df_profit['land_size'] * np.random.uniform(40000, 80000, 100)).round(2)
df_profit['net_profit'] = df_profit['revenue'] - df_profit['cost']
df_profit.to_csv(os.path.join(DATASETS_DIR, "crop_profit_dataset.csv"), index=False)

# 5. historical_price_dataset.csv (100 rows)
# crop_name, month, year, price
months = list(range(1, 13))
years = [2021, 2022, 2023, 2024, 2025]
data_price = {
    "crop_name": np.random.choice(crops, 100),
    "month": np.random.choice(months, 100),
    "year": np.random.choice(years, 100),
    "price": np.random.uniform(1500, 8000, 100).round(2)
}
pd.DataFrame(data_price).to_csv(os.path.join(DATASETS_DIR, "historical_price_dataset.csv"), index=False)

print("Created 5 datasets with 100 records each in the 'datasets' directory.")
