import React from "react";
import { type TemplateProps } from "./types";
import Template1 from "./Template1";
import Template2 from "./Template2";
import Template3 from "./Template3";
import Template4 from "./Template4";
import Template5 from "./Template5";
import Template6 from "./Template6";
import Template7 from "./Template7";
import Template8 from "./Template8";
import Template9 from "./Template9";
import TemplateLockedPdf from "./TemplateLockedPdf";

export default function TemplateRenderer(props: TemplateProps) {
  const { templateId } = props;

  switch (templateId) {
    case "template2":
      return <Template2 {...props} />;
    case "template3":
      return <Template3 {...props} />;
    case "template4":
      return <Template4 {...props} />;
    case "template5":
      return <Template5 {...props} />;
    case "template6":
      return <Template6 {...props} />;
    case "template7":
      return <Template7 {...props} />;
    case "template8":
      return <Template8 {...props} />;
    case "template9":
      return <Template9 {...props} />;
    case "locked-pdf":
      return <TemplateLockedPdf {...props} />;
    case "template1":
    default:
      return <Template1 {...props} />;
  }
}

