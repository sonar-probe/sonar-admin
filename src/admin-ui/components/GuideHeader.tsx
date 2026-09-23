import { Flex, Text } from "@radix-ui/themes";

import ColorSwitch from "@/shared/components/ColorSwitch";
import LanguageSwitch from "@/shared/components/Language";
import ThemeSwitch from "@/shared/components/ThemeSwitch";

export default function GuideHeader() {
  return (
    <Flex justify="between" align="center" gap="4" className="km-guide-header w-full">
      <Flex align="center" gap="2">
        <img
          src={`${import.meta.env.BASE_URL}assets/pwa-icon.webp`}
          alt="Sonar"
          className="size-9 object-contain"
        />
        <Text size="3" weight="bold">
          Sonar
        </Text>
      </Flex>
      <Flex gap="2">
        <LanguageSwitch />
        <ThemeSwitch />
        <ColorSwitch />
      </Flex>
    </Flex>
  );
}
