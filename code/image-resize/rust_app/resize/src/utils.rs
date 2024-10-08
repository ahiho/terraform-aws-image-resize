use crate::config::CONFIG;

pub fn limit(value: u32, low_limit: u32, high_limit: u32, rounding_value: Option<u32>) -> u32 {
    let rounding_value = rounding_value.unwrap_or(CONFIG.rounding_value);

    let result = ((value as f32) / (rounding_value as f32)).round() as u32 * rounding_value;

    if result < low_limit {
        return low_limit;
    }

    if result > high_limit {
        return high_limit;
    }

    result
}
