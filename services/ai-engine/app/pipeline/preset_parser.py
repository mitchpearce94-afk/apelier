"""
Lightroom Preset Parser — .xmp and .lrtemplate files

Extracts ~50-80 develop parameters from Lightroom presets and converts them
to our internal parameter names for application by the style engine.
"""
import logging
import re
import xml.etree.ElementTree as ET

log = logging.getLogger(__name__)

LR_PARAM_MAP = {
    "Exposure2012": "exposure", "Contrast2012": "contrast",
    "Highlights2012": "highlights", "Shadows2012": "shadows",
    "Whites2012": "whites", "Blacks2012": "blacks",
    "Clarity2012": "clarity", "Vibrance": "vibrance", "Saturation": "saturation",
    "Temperature": "temperature", "Tint": "tint",
    "ParametricShadows": "parametric_shadows", "ParametricDarks": "parametric_darks",
    "ParametricLights": "parametric_lights", "ParametricHighlights": "parametric_highlights",
    "ParametricShadowSplit": "parametric_shadow_split",
    "ParametricMidtoneSplit": "parametric_midtone_split",
    "ParametricHighlightSplit": "parametric_highlight_split",
    "HueAdjustmentRed": "hsl_hue_red", "HueAdjustmentOrange": "hsl_hue_orange",
    "HueAdjustmentYellow": "hsl_hue_yellow", "HueAdjustmentGreen": "hsl_hue_green",
    "HueAdjustmentAqua": "hsl_hue_aqua", "HueAdjustmentBlue": "hsl_hue_blue",
    "HueAdjustmentPurple": "hsl_hue_purple", "HueAdjustmentMagenta": "hsl_hue_magenta",
    "SaturationAdjustmentRed": "hsl_sat_red", "SaturationAdjustmentOrange": "hsl_sat_orange",
    "SaturationAdjustmentYellow": "hsl_sat_yellow", "SaturationAdjustmentGreen": "hsl_sat_green",
    "SaturationAdjustmentAqua": "hsl_sat_aqua", "SaturationAdjustmentBlue": "hsl_sat_blue",
    "SaturationAdjustmentPurple": "hsl_sat_purple", "SaturationAdjustmentMagenta": "hsl_sat_magenta",
    "LuminanceAdjustmentRed": "hsl_lum_red", "LuminanceAdjustmentOrange": "hsl_lum_orange",
    "LuminanceAdjustmentYellow": "hsl_lum_yellow", "LuminanceAdjustmentGreen": "hsl_lum_green",
    "LuminanceAdjustmentAqua": "hsl_lum_aqua", "LuminanceAdjustmentBlue": "hsl_lum_blue",
    "LuminanceAdjustmentPurple": "hsl_lum_purple", "LuminanceAdjustmentMagenta": "hsl_lum_magenta",
    "SplitToningHighlightHue": "split_highlight_hue",
    "SplitToningHighlightSaturation": "split_highlight_sat",
    "SplitToningShadowHue": "split_shadow_hue",
    "SplitToningShadowSaturation": "split_shadow_sat",
    "SplitToningBalance": "split_balance",
    "Sharpness": "sharpness", "SharpenRadius": "sharpen_radius",
    "SharpenDetail": "sharpen_detail", "SharpenEdgeMasking": "sharpen_masking",
    "LuminanceSmoothing": "nr_luminance", "ColorNoiseReduction": "nr_color",
    "PostCropVignetteAmount": "vignette_amount",
    "PostCropVignetteMidpoint": "vignette_midpoint",
    "PostCropVignetteRoundness": "vignette_roundness",
    "PostCropVignetteFeather": "vignette_feather",
    "GrainAmount": "grain_amount", "GrainSize": "grain_size",
    "GrainFrequency": "grain_frequency",
}


def parse_xmp_preset(xmp_content: str) -> dict:
    """Parse a Lightroom XMP preset file. Returns dict of internal param name to float."""
    params = {}
    try:
        content = xmp_content.strip().lstrip('\ufeff')
        root = ET.fromstring(content)

        # Extract crs: attributes and child elements
        for desc in root.iter():
            for attr_name, attr_val in desc.attrib.items():
                short = attr_name.split('}')[-1] if '}' in attr_name else attr_name
                if short in LR_PARAM_MAP:
                    try:
                        params[LR_PARAM_MAP[short]] = float(attr_val)
                    except (ValueError, TypeError):
                        pass

            tag = desc.tag.split('}')[-1] if '}' in desc.tag else desc.tag
            if tag in LR_PARAM_MAP and desc.text:
                try:
                    params[LR_PARAM_MAP[tag]] = float(desc.text)
                except (ValueError, TypeError):
                    pass

        # Tone curve points
        for elem in root.iter():
            tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
            if tag == 'ToneCurvePV2012':
                points = []
                for li in elem.iter():
                    li_tag = li.tag.split('}')[-1] if '}' in li.tag else li.tag
                    if li_tag == 'li' and li.text:
                        try:
                            x, y = li.text.split(',')
                            points.append([float(x.strip()), float(y.strip())])
                        except (ValueError, TypeError):
                            pass
                if points:
                    params['tone_curve'] = points

    except ET.ParseError:
        log.warning("XML parse failed, trying regex extraction")
        for lr_name, internal_name in LR_PARAM_MAP.items():
            for pat in [rf'{lr_name}="([^"]*)"', rf'{lr_name}\s*=\s*"([^"]*)"']:
                m = re.search(pat, xmp_content)
                if m:
                    try:
                        params[internal_name] = float(m.group(1))
                    except (ValueError, TypeError):
                        pass
                    break

    if params:
        log.info(f"Parsed XMP preset: {len(params)} parameters")
    return params


def parse_lrtemplate_preset(content: str) -> dict:
    """Parse a Lightroom .lrtemplate preset file (Lua-like key-value)."""
    params = {}
    for lr_name, internal_name in LR_PARAM_MAP.items():
        for pat in [rf'{lr_name}\s*=\s*(-?[\d.]+)', rf'{lr_name}\s*=\s*"(-?[\d.]+)"']:
            m = re.search(pat, content)
            if m:
                try:
                    params[internal_name] = float(m.group(1))
                except (ValueError, TypeError):
                    pass
                break
    if params:
        log.info(f"Parsed lrtemplate preset: {len(params)} parameters")
    return params


def parse_preset_file(content: str, filename: str = "") -> dict:
    """Auto-detect format and parse a Lightroom preset."""
    lower = filename.lower()
    if lower.endswith('.lrtemplate'):
        return parse_lrtemplate_preset(content)
    if lower.endswith('.xmp') or content.strip().startswith('<?xml') or '<x:xmpmeta' in content:
        return parse_xmp_preset(content)
    result = parse_xmp_preset(content)
    return result if result else parse_lrtemplate_preset(content)
